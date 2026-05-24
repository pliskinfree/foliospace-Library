package httpapi

import (
	"archive/zip"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"foliospace-reader/internal/db"
	"foliospace-reader/internal/service"
	"foliospace-reader/internal/store"
)

func TestAPIIndexesAndStreamsCBZPages(t *testing.T) {
	root := t.TempDir()
	makeZip(t, filepath.Join(root, "Series A", "book1.cbz"), map[string]string{"001.jpg": "image"})
	makeZip(t, filepath.Join(root, "Books", "sample.epub"), map[string]string{
		"META-INF/container.xml": `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OPS/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
		"OPS/package.opf": `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Sample EPUB</dc:title>
  </metadata>
  <manifest>
    <item id="chapter1" href="text/chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="cover" href="images/cover.jpg" media-type="image/jpeg" properties="cover-image"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>`,
		"OPS/text/chapter1.xhtml": `<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Chapter</h1></body></html>`,
		"OPS/images/cover.jpg":    "cover",
	})
	conn, err := db.Open(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	st := store.New(conn)
	lib, err := st.CreateLibrary("Test", root)
	if err != nil {
		t.Fatal(err)
	}

	ts := httptest.NewServer(New(service.New(st), nil).Routes())
	defer ts.Close()

	post(t, ts.URL+"/api/libraries/"+itoa(lib.ID)+"/scan", "")
	waitFor(t, func() bool {
		jobs, err := st.ListScanJobs()
		return err == nil && len(jobs) > 0 && jobs[0].Status == "completed"
	})
	body := get(t, ts.URL+"/api/series")
	if !strings.Contains(body, "Series A") {
		t.Fatalf("series response %q does not include Series A", body)
	}
	collectionsBody := get(t, ts.URL+"/api/collections")
	if !strings.Contains(collectionsBody, `"collectionType":"directory"`) || !strings.Contains(collectionsBody, `"directoryPath":"Series A"`) {
		t.Fatalf("collections response %q does not include directory collection fields", collectionsBody)
	}

	series, err := st.ListSeries()
	if err != nil {
		t.Fatal(err)
	}
	var cbzBookID int64
	for _, seriesItem := range series {
		if seriesItem.Title != "Series A" {
			continue
		}
		books, err := st.ListBooks(seriesItem.ID)
		if err != nil {
			t.Fatal(err)
		}
		cbzBookID = books[0].ID
	}
	if cbzBookID == 0 {
		t.Fatal("cbz book was not indexed")
	}
	volumesBody := get(t, ts.URL+"/api/collections/"+itoa(series[0].ID)+"/volumes")
	if !strings.Contains(volumesBody, `"bookType":"single_volume"`) {
		t.Fatalf("volumes response %q does not include single-volume book type", volumesBody)
	}

	pages := get(t, ts.URL+"/api/books/"+itoa(cbzBookID)+"/pages")
	if !strings.Contains(pages, "001.jpg") {
		t.Fatalf("pages response %q does not include 001.jpg", pages)
	}

	resp, err := http.Get(ts.URL + "/api/books/" + itoa(cbzBookID) + "/pages/0")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) != "image" {
		t.Fatalf("page body = %q, want image", string(data))
	}

	var epubBookID int64
	for _, seriesItem := range series {
		if seriesItem.Title != "Books" {
			continue
		}
		epubBooks, err := st.ListBooks(seriesItem.ID)
		if err != nil {
			t.Fatal(err)
		}
		epubBookID = epubBooks[0].ID
	}
	if epubBookID == 0 {
		t.Fatal("epub book was not indexed")
	}
	manifest := get(t, ts.URL+"/api/books/"+itoa(epubBookID)+"/epub/manifest")
	if !strings.Contains(manifest, "OPS/text/chapter1.xhtml") {
		t.Fatalf("manifest response %q does not include epub chapter", manifest)
	}
	chapter := get(t, ts.URL+"/api/books/"+itoa(epubBookID)+"/epub/resources/OPS/text/chapter1.xhtml")
	if !strings.Contains(chapter, "Chapter") {
		t.Fatalf("chapter response %q does not include Chapter", chapter)
	}
}

func get(t *testing.T, url string) string {
	t.Helper()
	resp, err := http.Get(url)
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	data, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}

func post(t *testing.T, url string, body string) {
	t.Helper()
	resp, err := http.Post(url, "application/json", strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		data, _ := io.ReadAll(resp.Body)
		t.Fatalf("POST %s status %d: %s", url, resp.StatusCode, data)
	}
}

func waitFor(t *testing.T, condition func() bool) {
	t.Helper()
	for range 50 {
		if condition() {
			return
		}
		time.Sleep(20 * time.Millisecond)
	}
	t.Fatal("condition was not met")
}

func itoa(value int64) string {
	return strconv.FormatInt(value, 10)
}

func makeZip(t *testing.T, path string, entries map[string]string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	file, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	writer := zip.NewWriter(file)
	for name, body := range entries {
		entry, err := writer.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := entry.Write([]byte(body)); err != nil {
			t.Fatal(err)
		}
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	if err := file.Close(); err != nil {
		t.Fatal(err)
	}
}
