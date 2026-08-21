Chatbots look intimidating from the outside and turn out to be surprisingly approachable once you actually start one. In this post I want to build a small chatbot in Python using NLTK, the Natural Language Toolkit. We'll start with the simplest version that works, then look honestly at where it breaks and fix it step by step.

You don't need any machine learning background for this. If you can write a Python function and a `while` loop, you can follow along.

## Setting up NLTK

NLTK is a library for working with human language in Python. Install it with pip:

```bash
pip install nltk
```

The library itself is small, but most of what makes it useful lives in separate data packages: tokenizer models, word lists, a dictionary of word forms. You download those once from Python:

```python
import nltk

nltk.download('popular')
```

A word of warning: `popular` is a bundle of the most commonly used datasets and it is a few hundred megabytes. It only needs to run once per machine. After that the data sits in your home directory and you can delete the `nltk.download` line from your script. If NLTK later complains about a missing resource, the error message names the exact package it wants and you download just that one. On my machine the tokenizer still asked for `punkt_tab` after installing `popular`, so I ran `nltk.download('punkt_tab')` once and moved on.

## Splitting a sentence into tokens

The first thing NLTK gives you is tokenisation: turning a string into a list of words and punctuation marks.

```python
from nltk.tokenize import word_tokenize

text = "Hello, welcome to Code With Gabo!"
print(word_tokenize(text))
```

Which prints:

```text
['Hello', ',', 'welcome', 'to', 'Code', 'With', 'Gabo', '!']
```

Notice that the comma and the exclamation mark came out as their own items. That's the point. `text.split()` would have given you `'Gabo!'` as a single chunk, and `'Gabo!'` is not a word you can look up in anything. Tokenisation is what lets you compare against real words instead of against whatever the user happened to type around them.

That matters more than it looks right now, so hold on to it.

## The simplest chatbot that works

Here's the naive version. A dictionary of exact phrases, and a lookup with a fallback:

```python
responses = {
    "hi": "Hello! I am GaboBot.",
    "what is your name": "My name is GaboBot.",
    "bye": "See you around!",
}

def chatbot_response(user_input):
    return responses.get(user_input, "I'm not sure how to respond to that.")
```

And a loop to talk to it. This uses the `chatbot_response` defined above, so keep both in the same file:

```python
print("Chatbot: Hi, I am GaboBot. Type 'quit' to exit.")

while True:
    user_input = input("You: ")
    if user_input.lower() == "quit":
        print("Chatbot: Bye!")
        break
    print("Chatbot:", chatbot_response(user_input))
```

Run it and type `hi`. It works. Now type `hi there`, or `Hi!`, or `hello`. All three fall through to "I'm not sure how to respond to that."

That's the real lesson of the naive version. A dictionary lookup asks "is this string exactly equal to a key I know", and humans never type exactly the key you know. This is where tokenisation stops being a demo and starts being useful.

## Matching on tokens instead of whole strings

Instead of comparing the entire sentence, break it into tokens and check whether any of them is a keyword we recognise:

```python
from nltk.tokenize import word_tokenize

KEYWORD_RESPONSES = {
    "hi": "Hello! I am GaboBot.",
    "hello": "Hello! I am GaboBot.",
    "hey": "Hello! I am GaboBot.",
    "name": "My name is GaboBot.",
    "help": "I can greet you and tell you my name. That's about it so far.",
    "bye": "See you around!",
}

DEFAULT_RESPONSE = "I'm not sure how to respond to that."

def chatbot_response(user_input):
    tokens = [token.lower() for token in word_tokenize(user_input)]
    for token in tokens:
        if token in KEYWORD_RESPONSES:
            return KEYWORD_RESPONSES[token]
    return DEFAULT_RESPONSE
```

Drop this in place of the old `chatbot_response` and keep the same loop. Now `hi there` and `HI!` both get the greeting: `Hi!` tokenises to `['Hi', '!']`, lowercasing gives `['hi', '!']`, and `hi` is in the dictionary.

It also shows you the next flaw, which is worth seeing rather than hiding. Type `Hey, what is your name?` and you get the greeting, not the name — the loop returns on the *first* token that matches, and `hey` comes before `name`. Whichever keyword appears earliest in the sentence wins, which is not a rule you ever meant to write. Keeping the first match is fine for a handful of rules; past that you want to score every candidate and pick the best one, which is exactly the road to intent classification further down.

The bot went from matching a handful of exact sentences to matching an unlimited number of sentences that happen to contain a keyword. Same amount of code, much better behaviour.

## Refining the tokens: stopwords and lemmatisation

Two more NLTK tools clean up the token list before you search it.

**Stopwords** are the extremely common words that carry almost no meaning on their own: *the*, *is*, *are*, *you*, *with*. **Lemmatisation** reduces a word to its dictionary form, so *helping* becomes *help* and *projects* becomes *project*.

```python
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from nltk.tokenize import word_tokenize

STOPWORDS = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()

def clean_tokens(text):
    tokens = [token.lower() for token in word_tokenize(text) if token.isalpha()]
    tokens = [token for token in tokens if token not in STOPWORDS]
    return [lemmatizer.lemmatize(token, pos="v") for token in tokens]

print(clean_tokens("Are you helping me with these projects?"))
```

That prints:

```text
['help', 'project']
```

Then swap the first line of `chatbot_response` to use it:

```python
def chatbot_response(user_input):
    for token in clean_tokens(user_input):
        if token in KEYWORD_RESPONSES:
            return KEYWORD_RESPONSES[token]
    return DEFAULT_RESPONSE
```

What this buys you is fewer keys to maintain. You no longer need separate entries for *help*, *helping* and *helped* — they all collapse to `help`. What it costs you is precision, and you should know about both costs:

- Your dictionary keys now have to be in lemmatised form. `thanks` lemmatises to `thank`, so the key `"thanks"` will never match again.
- Stopword removal deletes *not*. After cleaning, "I like this" and "I do not like this" look identical to your bot.
- Passing `pos="v"` lemmatises every token as if it were a verb, which is a blunt shortcut. The proper way is to tag each word with `nltk.pos_tag` and pass the matching part of speech. For a keyword bot, the shortcut is usually fine.

## What this approach can't do

I want to be straight about the ceiling here, because it arrives quickly.

- **It has no memory.** Every message is handled on its own. Ask "what is your name", then "and how old are you" — the bot has no idea what *you* refers to, because nothing carries over between turns.
- **It doesn't understand intent, only keywords.** "I need help" and "I don't need help" both contain `help` and both get the same answer.
- **First match wins.** In a sentence with two keywords, the answer depends on word order, which is not a rule you ever meant to write.
- **It doesn't scale.** Around a few dozen rules the dictionary starts contradicting itself and you spend more time debugging keyword collisions than adding features.

When you outgrow it, there are two usual next steps. One is intent classification: you collect a handful of example phrasings for each intent and train a classifier to pick the intent, using the same cleaned tokens as input features. The other is calling an LLM API and letting the model handle the language, keeping your code for the actions the bot can actually take. Both are more machinery than a dictionary, and if your bot really only needs to answer ten fixed questions, the dictionary is still the right call — it's predictable, it's free, and it never invents an answer.

## Where to go from here

The most fun next experiment is sentiment analysis: scoring whether a message reads as positive or negative, and having GaboBot respond differently to each. NLTK ships a rule-based scorer that needs one extra download:

```python
import nltk
nltk.download('vader_lexicon')

from nltk.sentiment import SentimentIntensityAnalyzer

sia = SentimentIntensityAnalyzer()
print(sia.polarity_scores("I love this bot"))
```

Wire that score into `chatbot_response` and you have a bot that reacts to *how* someone said something, not just *what* they said. That's a small change on top of everything above, and it's a good way to get a feel for how far simple tools can take you before you need the heavy ones.