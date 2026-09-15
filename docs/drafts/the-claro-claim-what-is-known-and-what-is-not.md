On September 13 a forum post claimed that someone had broken into Claro's systems in the Dominican Republic and taken a database of **2,889,256 customer records**. The number travelled fast, amplified from X, and within hours half the country was treating it as fact.

Two things got merged immediately that are worth pulling apart: what was claimed, and what has been verified. They are not the same, and the difference changes what you should do.

## What was claimed

According to the post, each record would include:

- National identification number
- Phone number
- Subscription information
- Account status
- Plan category
- Activation date
- Billing cycle
- Internal codes
- **ICCID**, the unique identifier of each SIM card

That last field is the one that says the most. An ICCID is not a marketing attribute: it identifies one specific SIM.

## What has not been verified

Nearly everything else.

The claim **could not be verified independently**. The circulated samples do not establish the origin of the data on their own, and they do not show the information is recent, complete, or taken from the company's systems.

Claro Dominicana **has not publicly confirmed** any incident. At the time of writing, no Dominican authority has announced an investigation or a notification either.

So the honest status is: an allegation circulating on social media, not a confirmed breach.

## Why that does not let you relax

This is where most people draw the wrong conclusion, in one direction or the other.

Some read "unconfirmed" and carry on. Others read the number and panic. Both reactions treat uncertainty as if it were information.

Look at the cost instead:

- **If the leak is fake** and you moved your two-factor authentication off SMS, you lost twenty minutes.
- **If it is real** and you waited for official confirmation, you waited during exactly the window when that data is worth the most.

That is not symmetric. And confirmation, when it arrives, usually arrives late: first someone has to verify, then decide what to say, and that takes days or weeks. Whatever was circulating has already circulated.

Absence of confirmation is not confirmation of absence.

## What someone could do with that data, if it were real

No need to imagine film plots. With an ID number, a phone, a plan and a billing cycle, two ordinary attacks get much easier.

**The first is the call that knows things about you.** The old script — "we're calling from your phone company" — fails because the caller knows nothing. With those fields they do: your name, your ID, which plan you have, when you get billed. Every security question your bank asks over the phone is on that list.

**The second is the SIM swap.** If someone convinces a service desk that they are you and moves your number to another SIM, they inherit your messages. And that is where it hurts: **SMS is still the second factor for almost everything here.** Your bank, your email, your accounts. Whoever controls your number can request the recovery code for everything else.

That is why the ICCID is not a boring technical detail. It is what turns a customer list into a target list.

## How a fraudulent SIM swap actually works

Worth understanding, because the defence becomes obvious once you see the order of the steps.

1. **The attacker already knows who you are.** Name, ID, number, plan. Nothing to guess.
2. **They present as you** and ask for a replacement SIM: lost phone, damaged card. They answer the verification questions because the answers are on the list.
3. **Your phone loses signal.** That is the only alarm you get, and it is easy to mistake for a network problem. That detail is why the attack works at night.
4. **Your texts now arrive on another device.** They open your email with "forgot my password", receive the code, and from the email everything else falls.

Notice where the weak point sits: not your password, not your phone, not even your data. It is the counter where a person decides whether the caller is you. Your security depends on the training of someone you have never met, serving a hundred customers a day.

That is why moving your second factor off SMS is the only defence that does not depend on that person.

## What to do this week

None of this depends on the leak being confirmed.

**Move your second factor off SMS.** Email, bank, social accounts: wherever it is offered, use an authenticator app. It is the highest-value change per minute spent, and the only one that protects you if your number stops being yours.

**Ask your carrier what it takes to move your number to a new SIM.** If the answer is "a phone call", that is the problem. Ask whether they offer in-person verification or an extra passphrase.

**Put a PIN on the SIM.** It is in your phone's security menu, takes a minute, and blocks the simple case where someone steals the handset and pulls the card.

**Change your mental rule about who calls you.** Someone knowing your ID number proves nothing now. It was never good proof; today it is not even weak proof. If your bank calls, hang up and call the number on the card.

**And never read a code out loud.** No bank, no carrier and no app will ask you over the phone for the code that just arrived.

## What this means for those of us who build software

If you build systems for Dominican customers, two assumptions changed.

**First: ID numbers and phone numbers are not secrets.** They never fully were, but any system verifying identity by asking for a national ID is performing theatre. If your account recovery rests on "tell me your document number", your account recovery is public.

**Second: SMS OTP is a borrowed factor.** You do not control it — the carrier does, and its security is the security of their customer service desk. If your app protects money or sensitive data, at least offer an authenticator app.

And a third, less comfortable one that applies even if this case turns out to be false: **you are one export away too.** Almost every customer database can be dumped whole from the inside. The useful questions are not about firewalls:

- How many fields do you store that you never use? Each one is surface.
- Who can export the full customer table, and is it logged?
- If a dump with your schema appeared tomorrow, could you say within hours whether it is yours and how old it is?

That last one is what separates a credible response from two weeks of silence.

## How to read the next leak claim

There will be another one. Better to have criteria beforehand than during.

**Is there a verifiable sample?** Not screenshots: records an independent party can cross-check against known real data. A screenshot proves nothing about origin; a thousand rows that line up does.

**Are the fields internal or catalogue?** A name and a phone number can come from anywhere. An ICCID, an internal code or a billing cycle do not appear on a public form. The fields that exist only inside the system are the hard part to fake.

**Is the data fresh?** The question that kills most claims. If not one line in the sample was activated this year, you are probably looking at old data from another breach, resold under a new label.

**Has anyone cross-checked it against previous leaks?** Repackaging old dumps and selling them as new is a business, not an exception. It is the most boring explanation and therefore the most common one.

**And who is telling you?** An account that aggregates leaks is not a source that verifies them. Amplifying and checking are two different jobs.

With those five filters, most internet scares resolve themselves within a day.

## What a company should publish to end it

There is an asymmetry almost nobody notices: **the company is the only party that can close this cheaply.**

Whoever claims to hold the data cannot prove its origin without exposing themselves. Anyone reviewing from outside can only say "looks plausible". But the company has its own schema. It knows whether a field named the way the sample names it exists in its systems, whether that internal code format is theirs, and whether those activation dates match its own history.

A useful statement is three sentences:

- **We reviewed the sample**, and these fields do or do not match our schema.
- **If they match**, this is the scope and these are the affected accounts.
- **Here is what you should do**, with concrete instructions.

A useless statement says customer security is a priority.

Silence carries a cost that is invisible at the time: it leaves everyone managing the worst case alone. And it keeps the rumour alive, which is harder to kill in two weeks than in two days.

## The legal frame, and its gap

In the Dominican Republic the reference is **Ley 172-13**, of December 13, 2013, on the protection of personal data. What it clearly establishes:

- Processing personal data requires the subject's prior, free, unambiguous and specific consent, save the exceptions the law itself sets out.
- Whoever processes data must adopt **technical and organisational measures** to prevent unauthorised access or alteration.
- You have the right to have your data rectified, updated or deleted, and the controller has a maximum of **ten business days** from your claim.

What I did not find in the sources I checked is an explicit obligation to **notify a breach** to those affected. If a later regulation creates one, I did not come across it, and that seems worth saying plainly instead of asserting the opposite.

That gap explains a lot. When no legal clock is running, "no comment" is a viable strategy. In Europe it would not be: the regulation there requires notification within 72 hours. Here the incentive points the other way.

## How this probably ends

There are three possible endings. Someone verifies the samples and they turn out to be authentic. Someone shows they are old data, recombined from earlier leaks — which happens more than people think. Or nothing happens and the story fades in two weeks without anyone knowing.

The third is the most likely. And it is the worst, because it leaves everyone with the same doubt and no reason to change anything.

That is why the advice above does not depend on the ending. Moving your second factor off SMS is worth it if this turns out to be smoke, worth it if it turns out to be true, and worth it the next time a list with your name on it shows up.

**Sources:** [N Digital](https://n.com.do/2026/09/13/usuario-asegura-haber-accedido-a-datos-de-casi-2-9-millones-de-clientes-de-claro-en-rd/) · [EyR](https://eyr.com.do/presunta-filtracion-datos-clientes-claro-dominicana/) · [Ley 172-13, official text](https://www.one.gob.do/media/u5ohmfyp/ley-172-13.pdf)
