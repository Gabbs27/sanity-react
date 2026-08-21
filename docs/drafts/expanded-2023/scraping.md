I reach for Python whenever I need data off a page that has no API. This post walks through the pieces I actually use — Requests, Beautiful Soup, robots.txt — and the habits that keep a scraper from breaking or getting you blocked.

## What is web scraping?

Web scraping involves programmatically gathering data from websites. This can be done for various purposes, such as analyzing content, aggregating data, or automating tasks that would otherwise require manual input.

## Why Python for web scraping?

The libraries are the reason. Requests handles HTTP, Beautiful Soup parses broken HTML without complaining, and Scrapy takes over when a job outgrows a single script.

## Step 1: Setting up your environment

Before we start, make sure you have Python installed on your system. You'll also need two key libraries: Beautiful Soup and Requests. Install them with pip:

```bash
python3 -m pip install beautifulsoup4 requests
```

## Step 2: Making your first request

Let's start by fetching the content of a webpage. We'll use the Requests library for this:

```python
import requests

url = "https://quotes.toscrape.com/page/1/"
response = requests.get(url)
html_content = response.text
print(html_content[:500])
```

That works, but it has two problems that will bite you on a real site.

### Send a User-Agent header

By default, Requests identifies itself with a `User-Agent` like `python-requests/2.x`. That string is a giveaway that you are not a browser, and plenty of sites either block it outright or serve a stripped-down page. Set a header that says who you are:

```python
import requests

HEADERS = {"User-Agent": "GaboScraper/1.0 (+https://codewithgabo.com)"}

url = "https://quotes.toscrape.com/page/1/"
response = requests.get(url, headers=HEADERS, timeout=10)
html_content = response.text
```

I prefer an honest custom string over pretending to be Chrome. If the site owner looks at their logs, they can see what hit them and where to complain. The `timeout` matters too: without it, a slow server can hang your script forever.

### Check the response before you parse it

This is the mistake I see most often from beginners. A 404 or a 403 still returns HTML, so Beautiful Soup happily parses the error page, `find_all` returns an empty list, and you spend an hour debugging a selector that was fine all along. Check first:

```python
response = requests.get(url, headers=HEADERS, timeout=10)
print(response.status_code)   # 200 means OK
response.raise_for_status()   # raises an exception on 4xx / 5xx
html_content = response.text
```

`raise_for_status()` turns a silent wrong answer into a loud error, which is exactly what you want while you are still building the thing.

## Step 3: Parsing HTML with Beautiful Soup

Once you have the HTML content, use Beautiful Soup to parse and navigate the data. This snippet assumes `html_content` from the previous step:

```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(html_content, "html.parser")
print(soup.prettify())
```

`prettify()` prints the document with indentation. It is noisy, but early on it is the fastest way to see what you actually received rather than what you assumed you received.

## Step 4: Extracting data

Now let's extract specific data. Suppose we want every top-level headline on a page:

```python
headlines = soup.find_all("h1")
for headline in headlines:
    print(headline.text.strip())
```

`.strip()` is not optional in practice. HTML is full of stray newlines and indentation, and without it your data ends up padded with whitespace.

## Step 5: Handling more complex queries

For more complex data extraction, you can use CSS selectors. `select` returns every match, `select_one` returns the first or `None`:

```python
quotes = soup.select("div.quote")
for quote in quotes:
    text = quote.select_one("span.text").text
    print(text)
```

Careful: `select_one` returns `None` when nothing matches, and `None.text` raises `AttributeError`. On a page where one item is missing a heading, guard it:

```python
for quote in quotes:
    author = quote.select_one("small.author")
    print(author.text.strip() if author else "(unknown)")
```

## Step 6: Be a polite scraper

While web scraping is powerful, it's important to respect website terms and avoid overloading servers. Two concrete habits cover most of it.

**Read robots.txt in code, not just with your eyes.** Python ships with a parser, so your script can ask the question itself:

```python
from urllib.parse import urljoin
from urllib.robotparser import RobotFileParser

USER_AGENT = "GaboScraper/1.0 (+https://codewithgabo.com)"
BASE = "https://quotes.toscrape.com"

rp = RobotFileParser()
rp.set_url(urljoin(BASE, "/robots.txt"))
try:
    rp.read()
except Exception:
    print("could not read robots.txt - stopping")
    raise SystemExit(1)

print(rp.can_fetch(USER_AGENT, f"{BASE}/page/1/"))
print(rp.crawl_delay(USER_AGENT))  # None if the site doesn't specify one
```

Read robots.txt once at startup and reuse the parser. `robots.txt` is a request, not a lock, but ignoring it is how you get your IP banned.

**Slow down.** One request per second is plenty for a hobby project and keeps you off anyone's radar:

```python
import time

time.sleep(1)  # between requests, every time
```

## Step 7: Pagination

Most listings span several pages. The reliable pattern is to follow the site's own "next" link and stop when it disappears, rather than guessing how many pages exist. Add a hard page cap so a bug can't turn into an accidental crawl of the whole internet.

## Putting it all together

Here is the complete script. It reads robots.txt, sets a User-Agent, checks the status, walks the pages, and sleeps between requests. It runs against `quotes.toscrape.com`, a site built specifically for scraping practice:

```python
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from urllib.robotparser import RobotFileParser

BASE = "https://quotes.toscrape.com"
USER_AGENT = "GaboScraper/1.0 (+https://codewithgabo.com)"
HEADERS = {"User-Agent": USER_AGENT}
DELAY = 1.0
MAX_PAGES = 5


def fetch(url):
    response = requests.get(url, headers=HEADERS, timeout=10)
    response.raise_for_status()
    return response.text


def parse_page(html):
    soup = BeautifulSoup(html, "html.parser")
    quotes = []
    for quote in soup.select("div.quote"):
        text = quote.select_one("span.text")
        author = quote.select_one("small.author")
        quotes.append({
            "text": text.text.strip() if text else "",
            "author": author.text.strip() if author else "",
            "tags": [tag.text.strip() for tag in quote.select("a.tag")],
        })
    next_link = soup.select_one("li.next a")
    next_url = urljoin(BASE, next_link["href"]) if next_link else None
    return quotes, next_url


def main():
    rp = RobotFileParser()
    rp.set_url(urljoin(BASE, "/robots.txt"))
    rp.read()

    url = f"{BASE}/page/1/"
    collected = []
    pages = 0

    while url and pages < MAX_PAGES:
        if not rp.can_fetch(USER_AGENT, url):
            print(f"robots.txt disallows {url} - stopping")
            break
        print(f"Fetching {url}")
        quotes, url = parse_page(fetch(url))
        collected.extend(quotes)
        pages += 1
        time.sleep(DELAY)

    for quote in collected:
        print(f"{quote['author']}: {quote['text']}")
    print(f"\n{len(collected)} quotes from {pages} page(s)")


if __name__ == "__main__":
    main()
```

Save it as `scrape.py`, run `python3 scrape.py`, and you should see quotes printed one page at a time.

## When not to scrape

This is the part I wish someone had told me first.

- **If the site has an API, use the API.** It returns structured JSON, it is versioned, and it won't break because a designer renamed a CSS class. Check for `/api`, a developer subdomain, or an RSS feed before you write a single selector.
- **Scrapers are fragile by design.** You are depending on markup that nobody promised to keep stable. Expect your script to break, and write it so a failure is loud rather than silently producing empty rows.
- **Some sites forbid it in their terms of service.** Read them. "Technically possible" and "allowed" are different questions.
- **Personal data brings legal obligations** no matter how you obtained it. Rules vary by jurisdiction and by site, and I'm a developer, not a lawyer. If you are collecting anything that identifies a person, get real advice before you collect it.

For bigger jobs, look at [Scrapy](https://scrapy.org/) for large crawls with retries and throttling built in, and [Playwright](https://playwright.dev/python/) for pages whose content is rendered by JavaScript after load.

Start with simple targets, keep the volume low, and let the site's own signals tell you what is fair game. Practice is key to getting comfortable with scraping, and the good habits are much easier to build on day one than to retrofit later.