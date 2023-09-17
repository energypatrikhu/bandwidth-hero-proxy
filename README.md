bandwidth-hero-proxy

leírások:
  url:
    type: string, string-array
    értéke: URL encoded 1 vagy több darabb URL -t tartalmazva
    replacer: /http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, 'http://'
      - ez fontos
  jpg:
    type: string
    értéke:
      '1' v. '0'
      '1' -> kimeneti típus 'jpg'
      '0' -> kimeneti típus 'webp'
  bw:
    neve: grayscale
    type: string
    értéke:
      '1' v. '0'
      '1' -> kimeneti szín 'fekete-fehér'
      '0' -> kimeneti szín 'eredeti'
  l (L):
    neve: quality
    type: string
    értéke:
      '0' és '100' között
      értéke a kép kimeneti minőségét adja meg
      nagyobb: jobb minőség | kisebb: rosszabb minőség


http server:
  a user reqestnél küld 4 query adatott:
    - url
    - jpg
    - bw
    - l

  amennyiben a user nem küld URL query adatott a server 'bandwidth-hero-proxy' szöveggel válaszól
  ellenkező esetben a query adatokat felhasználva, tömöríti a képet, majd azt vissza küldi a server a usernek

  /favicon.ico
    statusCode: 204

  request válasznál:
    headers:
      ... {a kép által vissza adott headerek} ...
      +
      content-encoding: 'identity'
      content-type: 'image/{ kiválasztott formátum (webp/jpeg) }'
      content-length: '{ tömörített kép mérete }'
      x-original-size: '{ eredeti kép mérete }'
      x-bytes-saved: '{ megtakarított méret }'
    statusCode: 200

  redirect: (ha nem volt még átíránytva)
    headers:
      + content-length: '0'
      - cache-control
      - expires
      - date
      - etag
      + location: encodeURI(url)
    statusCode: 302


kép átalakító:
  mindig a legjobban tömörített változatban adja vissza a quality(l) figyelembe vételével

  ha az url gif -et tartalmaz:
    ha a kimeneti kép webp:
      tömörítse animated webp formátumba
    ha a kimeneti kép jpeg:
      ne tömörítse, hanem redirektálja az URL-hez a user kérelmet, így az eredeti képet kapja meg

  ha a tömörített kép NAGYOBB mint az eredeti:
    redirektálja az URL-hez a user kérelmet

  ha NEM lehet tömöríteni:
    redirektálja az URL-hez a user kérelmet

  {
    quality: l (ide a query 'l' paraméter)
    effort: 6 (ez csak 'webp' esetében)
    mozjpeg: true (ez csak 'jpeg' esetében: amenyiben az átalakító támogatja, ha nem akkor a jpeg formátumnál lévő legjobb tömörítést használd)
  } + grayscale (ha a user kérelmezte)

kívánt kép requestnél:
  ügyelve arra, hogy nem minden request modult fogal el eggyes szolgáltató
    (pl.: nekem se az alapértelmezett http/https/http2 modult nem fogadja el, se a fetch -et, csak az axios -t)

  headers:
    ... {
      user reqestnél lévő headerekből (amenyiben tartalmazza):
        'cookie', 'dnt', 'referer'
    } ...
    +
    accept-encoding: '*',
    user-agent: 'Bandwidth-Hero Compressor',
    x-forwarded-for: request.headers['x-forwarded-for'],
    via: '1.1 bandwidth-hero',

tesztelésre:
  használd a bandwidth-hero-proxy extension-t a böngészőben
  https://chrome.google.com/webstore/detail/bandwidth-hero-live-image/mmhippoadkhcflebgghophicgldbahdb

+ kód: (hátha segít)
  https://github.com/energypatrikhu/bandwidth-hero-proxy
