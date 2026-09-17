On September 15 I published [an analysis of the Claro claim](https://codewithgabo.com/the-claro-claim-what-is-known-and-what-is-not) with a section called "how to read the next leak claim." I wrote that there would be another one.

It arrived today. Four days after the Claro one.

An account that monitors cybercrime channels, VECERT Analyzer, published an alert: someone shared a download link that **allegedly** contains records from the Dominican National Police's complaint management system, the SPGD. A 10,000-line file on a temporary hosting platform.

The alert itself says it in its first line: **status, unconfirmed.** There is visible evidence — the link exists, and whoever posted it attached the institution's crest — but the authenticity of the records, how current they are, and the extent of any compromise are all unverified.

At the time of writing I could not find a single Dominican outlet covering it, nor a response from the Police.

So I am going to do what I said should be done: run the five filters, in public, without knowing in advance what comes out.

## Why this one matters more than Claro

Before the filters, the context. The SPGD is not a customer list.

According to the National Police itself, **more than four million records** were migrated into the system, and it is fed from more than 170 reception centres across the country. The public portal accepts official complaints, anonymous tips and **gender violence** reports, and asks the citizen for personal data, a detailed account of what happened, and contact details.

That same portal makes a promise, verbatim: *"Se garantizará la protección de la identidad de la persona denunciante y/o de la persona afectada"* — the identity of the person reporting, and of the person affected, will be protected.

A leaked phone list makes scams easier. A complaints database identifies who reported, whom they reported, and what they said. If the claim were true, that exact promise is what would have been broken.

Which is why this case calls for more care than the last one, not less. And why one thing comes before any filter:

**Do not look for that file. Do not download it. Do not share it.** If it is fake, it is bait — a file of criminal origin that someone wants you to open. If it is real, inside it are people who reported an abuser believing nobody else would know. I did not download it to write this, and nothing in this analysis needs it.

## Filter 1: is there a verifiable sample?

There is more than in the Claro case: not a screenshot, but a link to a file. But "a file exists" and "the file is what they say" are different claims, and no independent party has verified the second. The alert itself acknowledges that.

Verdict: evidence that someone posted something. Nothing more.

## Filter 2: are the fields internal or catalogue?

The alert does not say which fields the file contains. No schema, no described sample, nothing to compare against. This is the filter that best separates a real leak from a rehash, and here it cannot even begin.

Verdict: no data.

## Filter 3: is the data fresh?

Also unknown. And there is a trap specific to this system: because millions of historical records were migrated into the SPGD, old data would not prove the claim false — the real system contains it. What would prove current access is recent records, and nobody has shown any.

Verdict: no data.

## Filter 4: has anyone cross-checked it against previous leaks?

Not that anyone has published. With one piece of arithmetic on top: 10,000 lines against more than four million records is **0.25%** of the system. That could be a sample to prove access, it could be everything someone has, or it could be a slice of something else. All three explanations produce exactly the same link.

Verdict: no data.

## Filter 5: who is telling you?

An aggregator. One that, to its credit, labels the alert unconfirmed from its first line. The risk comes afterwards: every time someone forwards it, that label is the first thing to fall off. "Alleged leak, unconfirmed" becomes "the Police got hacked" within two forwards.

And a detail worth writing down: the alias this post is attributed to **differs by one character** from the one the press attributed to the Claro claim. It could be the same person, someone's transcription error, or an imitator riding the name of the moment. I do not know, and whoever tells you they do does not know either.

Verdict: a source that is honest about its own uncertainty. The forwards will not be.

## The scoreboard

Five filters: one with partial evidence, three with no data, one that describes the messenger. **That is not "false." It is "unknown."** And unknown is a complete answer — the only honest one today.

## What to do if you filed a complaint

The advice here is not the Claro advice. There is no second factor to move.

**If "the Police" call you with details of your case, that no longer proves anything.** Knowing your complaint does not show the caller is an officer. If they ask for money, data, or for you to go somewhere: hang up, and verify yourself at your station or through official channels.

**If you reported an abuser and this worries you**, the Ministry of Women's Línea Mujer is `*212`: free, confidential, 24 hours, dialled from any Altice, Claro or Viva mobile in the Dominican Republic. Do not wait for anyone to confirm anything before calling.

**And do not go looking to see whether you are in the file.** It is the natural reaction, and it is exactly the one bait relies on.

## What this means for those of us who build systems

The alert's technical recommendation is its most useful part, and it applies to everyone: audit the access logs to identify which user or IP recently ran mass queries or exported 10,000 records.

The uncomfortable question is whether your system could answer it. Is it logged who exports? Does an alert fire when one account reads ten thousand rows in an afternoon? A system with more than 170 points of entry has more than 170 sets of credentials; the question is never whether one gets compromised, but how much it can read before anyone notices.

That capability — being able to say within hours "yes, that was ours" or "no, it was not" — is the same one I asked for in the Claro post. Four days later it is the missing piece again.

**Sources:** the alert is from VECERT Analyzer, marked unconfirmed by the account itself · [National Police, on the SPGD](https://www.policianacional.gob.do/policia-nacional-moderniza-certificaciones-vehiculares-y-denuncias-con-plataforma-digital/) · [Complaints portal](https://denuncias.policia.gob.do/) · [Línea Mujer *212](https://mujer.gob.do/index.php/servicios/linea-mujer-212)
