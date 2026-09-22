On Saturday, September 12, I built an issuer of electronic fiscal receipts, the e-CF that the Dominican tax authority, the DGII, requires. It builds the invoice XML, signs it with the business's digital certificate, validates it against the official schema and prints the invoice with its QR code. It is in my portfolio, with [a demo](https://invoice-generator-orpin-nine.vercel.app) anyone can try.

Its first screen says, in Spanish, that using it does not make you an *emisor electrónico*, an authorised electronic issuer.

That sentence is not modesty. It is the most important thing I learned building it, and it is exactly what gets confused now that the deadlines are close: **generating the XML is not invoicing.**

These are the deadlines:

- **Large local and medium taxpayers:** from **November 1** they can only issue e-CF. Their non-electronic "B" sequences are valid until October 31.
- **Small, micro and unclassified taxpayers:** the deadline to implement falls on **November 15**.

## What the law and the regulation say

Law 32-23 gave each group a deadline counted from May 2023: 12 months for large national taxpayers, 24 for large local and medium ones, and 36 for everyone else. This is how it has played out:

- **Large national taxpayers:** their deadline was May 15, 2024. Their B receipts were declared expired on December 31, 2025.
- **Large local and medium taxpayers:** deadline May 15, 2025, extended six months for those who had already applied to become issuers. Only e-CF from November 1, 2026.
- **Small, micro and unclassified:** deadline May 15, 2026, extended six months automatically, to November 15.

Before betting on another extension, it is worth reading two articles of the law's regulation, Decree 587-24. Article 8 says the extension is a one-time measure and cannot exceed six months. The small taxpayers already got theirs, and it was exactly six months. Article 55 says that for anyone who does not implement in time, the DGII treats their receipts as expired.

The two earlier groups were later given a date to stop using the B series. The small ones have not been given one yet, and that buys no extra time: November 15 is the date to be **authorised as an electronic issuer**. According to the extension notice, anyone who has not implemented faces the penalties in article 27 of the law, which points to the Tax Code: fines of 5 to 30 minimum wages for breaching formal duties.

## What I built, and what it does not do

My issuer does the part people picture when they think of e-invoicing. It builds the XML for the tax credit invoice (type 31) and the consumer invoice (type 32), signs it, validates it and stores it. Each receipt carries a 13-character e-NCF: an `E`, two digits for the type and ten for the sequence, as in `E310000000001`.

Generating, signing, validating and printing took me a Saturday, with Claude Code alongside.

What it does not do is send anything to the DGII, and that changes everything. Question 1.4.12 of the DGII's own FAQ says it bluntly: if the tax authority never receives the e-CF, it **has no tax validity**, and the buyer cannot claim the tax credit.

In other words, a PDF with its QR code, signed and validated, that the DGII never received is useless to your customer's tax credit. That is why the warning is on the first screen and not buried in the README.

## What I learned building the easy part

The "easy" part has traps of its own, and no tutorial mentions them.

**One space breaks the schema for the tax credit invoice.** An e-CF is validated against XSD schemas the DGII publishes. The one for type 31, the invoice businesses use with each other, defines one of its types like this:

```
<xs:simpleType name=" IndicadorServicioTodoIncluidoType">
```

Look at the space before `Indicador`. The rest of the file looks the type up by its name, without the space. The validator that ships with Java trims the space and carries on. libxml2 does not. It is the engine behind `xmllint`, `lxml` in Python, `DOMDocument` in PHP and the Node package my issuer uses, and it refuses to load the schema:

```
The QName value 'IndicadorServicioTodoIncluidoType' does not resolve to a(n) type definition.
WXS schema e-CF 31 v.1.0.xsd failed to compile
```

The schemas for types 32, 33, 34, 44 and 45 define the same type without the space. I checked again today against what the DGII publishes, and the file is unchanged.

And a confession: I was slow to see it. What I wrote in the repo is that the schema used a type it never defined. It did define it, with one space too many, and my text search could not find it because of that same space.

**The official signing example has three misspelled URIs.** The DGII publishes a document, *Firmado de e-CF*, with examples of how to sign. The XML that shows the structure of the signature has these three:

```
http://www.w3.org/TR/2001/RECxml-c14n-20010315
http://www.w3.org/2001/04/xmldsigmore#rsa-sha256
http://www.w3.org/2000/09/xmldsig#envelope d-signature
```

They should read `REC-xml-c14n`, `xmldsig-more` and `enveloped-signature`. The TypeScript example in the same document spells them correctly. But if you build your signature by copying that XML, it fails: I tried it with `xml-crypto`, and it answers that the canonicalisation algorithm *"is not supported"*. A bad signature is not a cheap mistake, either. According to question 1.4.18, if the DGII rejects an e-CF over its signature, that e-NCF can never be used again.

**The portal answers a script with a 403.** The schemas are downloaded from the DGII's portal. With `curl`, the answer is 403; with a browser's User-Agent, 200. I tried it again today. For a while I assumed the DGII blocked automated downloads, and I wrote that into the project plan. It does not block them: it filters by User-Agent. That matters because the schemas have to be checked before every release. The ones for debit and credit notes changed on April 1, 2026, almost six months after the rest.

**The real risk is not the XML, it is the sequence.** Two receipts cannot share a number, and you cannot go past the range the DGII authorised. In my issuer, each invoice is saved to a file named after its e-NCF, written like this:

```js
writeFileSync(`datos/facturas/${encf}.xml`, xml, { flag: 'wx' });
```

With `wx`, the write fails if the file already exists. It does the job of a unique index in a database: a duplicate blows up instead of slipping through quietly. And the next number is worked out by reading what was already issued, not from a counter that can be wrong.

## Issuing means receiving

This was the big surprise, and it is the underlying reason my issuer does not get you compliant.

You think of e-invoicing as something that goes out: your system signs and sends. But article 18 of the regulation says that **every electronic issuer is also an electronic receiver**. Your suppliers who already issue e-CF will send theirs to you, and your system has to receive them, acknowledge receipt, and approve or reject them.

That is why, to certify your own system, the DGII asks for three web service addresses. One to **receive** the e-CF issued to you. Another to receive the **commercial approvals** of what you issue. And one for **authentication**, where a "seed" file is signed with the digital certificate and a token comes back. Then come the data, simulation and communication tests.

My issuer only listens on `127.0.0.1`, meaning the computer it runs on. I did that on purpose, so the business's digital certificate never leaves that machine. To be certified, it would have to open three doors to the internet. That is the real tension, and a well-formed XML does not resolve it.

## If you run a business: three paths and one question

The DGII recognises three ways to issue: your own system, a certified e-invoicing service provider, or its free invoicing tool, the *Facturador Gratuito*.

- **The Facturador Gratuito** costs nothing and does not require certification. It is meant for low volume: the DGII talks about roughly 150 invoices a month. You still need a tax ID, authorisation to issue receipts, access to the DGII's online office and a digital certificate for tax procedures. That certificate goes in your name or your representative's, not your accountant's.
- **A certified provider** has to offer you, by regulation, the whole package: issuing and receiving, acknowledgements of receipt, commercial approvals and storage of your receipts.
- **Building your own** is the path with the three addresses and the tests above. With 55 days left, I would not start it today without a technical team behind it.

If you go with a provider, there is one question worth more than the demo: **who holds my certificate?** Article 22 of the regulation allows two models. In one, signing happens on your infrastructure and the certificate stays with you. In the other, the provider sells its software as a service and **keeps your certificate on its own infrastructure**. For that it needs an interconnection with a certification entity authorised by INDOTEL, the Dominican telecom regulator, or an INDOTEL licence to sign on behalf of others. That certificate signs receipts in your name before the DGII. Ask which of the two models you are in, and get it in writing.

## If you are a developer

If someone asks you to "do the e-invoicing", ask which part first. Generating, signing and validating the XML took me a Saturday. Receiving, approving, authenticating, passing certification and keeping up every time the DGII changes a schema is a product.

My issuer still says on its first screen that it does not make you an electronic issuer. Having built it, that is the sentence I am most sure of.

**Sources (in Spanish):** [Notice 14-26, e-CF only](https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2026/14-26.pdf) · [Notice 06-26, extension for small, micro and unclassified taxpayers](https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2026/06-26.pdf) · [Notice 12-25](https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/12-25.pdf) · [Notice 25-25](https://dgii.gov.do/publicacionesOficiales/avisosInformativos/Documents/2025/25-25.pdf) · [Law 32-23](https://dgii.gov.do/legislacion/leyesTributarias/Documents/Otras%20Leyes%20de%20Inter%C3%A9s/32-23.pdf) · [Decree 587-24](https://dgii.gov.do/legislacion/decretos/Documents/2024/Decreto587-24.pdf) · [e-CF FAQ](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Preguntas%20frecuentes/Generales/Preguntas%20Frecuentes%20e-CF%20Generales.pdf) · [Facturador Gratuito FAQ](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Preguntas%20frecuentes/Generales/Preguntas-Frecuentes-Facturador-Gratuito.pdf) · [Technical documentation and XSD schemas](https://dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/documentacionSobreE-CF.aspx) · [The issuer's code](https://github.com/Gabbs27/invoice-generator)
