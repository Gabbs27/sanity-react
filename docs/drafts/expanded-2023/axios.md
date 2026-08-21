Consuming REST APIs is a fundamental part of building modern web applications. In React, several libraries are available to handle this task, including Fetch and Axios. They look almost identical in a simple example, which is why the choice feels arbitrary at first — but they behave differently in the exact places where beginners get stuck. Let's go through both, and then through the differences that actually matter.

## Fetch

Fetch is a built-in browser API for making HTTP requests. It is a promise-based API, which means it returns a promise that resolves to a Response object when the request is complete.

```jsx
import React, { useEffect, useState } from 'react';

// eslint-disable-next-line no-unused-vars
function TodoList() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/todos')
      .then(response => response.json())
      .then(data => setTodos(data));
  }, []);

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

In the example above, we're using the useEffect hook to make the API call when the component mounts. We then use the `json()` method to convert the response to a JSON object, which we then set as the state of our component using the `setTodos` function.

## Axios

Axios is a popular third-party library for making HTTP requests in JavaScript. It is also promise-based, and it provides a simple API for making requests and handling responses. You install it first with `npm install axios`.

```jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

// eslint-disable-next-line no-unused-vars
function TodoList() {
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    axios.get('https://jsonplaceholder.typicode.com/todos')
      .then(response => setTodos(response.data));
  }, []);

  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

In the example above, we're using the `get()` method of the Axios library to make the API call. We then use the `data` property of the response object to set the state of our component. Notice there is no `json()` step — Axios already parsed the body for you.

## The difference that actually bites you: errors

This is the one I wish someone had told me on day one. **Fetch does not reject on a 404 or a 500.** As far as fetch is concerned, the server answered, so the promise resolves. Only a network failure (no connection, DNS error, CORS block) rejects it. That means a broken endpoint quietly flows into your success path, `response.json()` tries to parse an error page, and you end up debugging the wrong thing.

You have to check `response.ok` yourself. The two snippets below are just the `useEffect` from the components above, with one extra piece of state alongside `todos` to hold the message:

```jsx
const [error, setError] = useState(null);
```

```jsx
useEffect(() => {
  fetch('https://jsonplaceholder.typicode.com/todos/999999')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.json();
    })
    .then(data => setTodos(data))
    .catch(error => setError(error.message));
}, []);
```

Axios rejects on any non-2xx status by default, so the failure lands in `catch` where you expect it. The error object carries a `response` when the server replied, and doesn't when the request never got there:

```jsx
useEffect(() => {
  axios.get('https://jsonplaceholder.typicode.com/todos/999999')
    .then(response => setTodos(response.data))
    .catch(error => {
      if (error.response) {
        setError(`Request failed with status ${error.response.status}`);
      } else {
        setError(error.message);
      }
    });
}, []);
```

Both are fine. Fetch just makes you opt in to the behaviour most people assumed they already had.

## Cleaning up when the component unmounts

If the user navigates away before your request finishes, your `.then` still runs and calls `setTodos` on a component that no longer exists. The fix is an `AbortController` and a cleanup function returned from `useEffect`:

```jsx
useEffect(() => {
  const controller = new AbortController();

  fetch('https://jsonplaceholder.typicode.com/todos', { signal: controller.signal })
    .then(response => response.json())
    .then(data => setTodos(data))
    .catch(error => {
      if (error.name === 'AbortError') return;
      console.error(error);
    });

  return () => controller.abort();
}, []);
```

Axios accepts the same `AbortController` signal in current versions:

```jsx
useEffect(() => {
  const controller = new AbortController();

  axios.get('https://jsonplaceholder.typicode.com/todos', { signal: controller.signal })
    .then(response => setTodos(response.data))
    .catch(error => {
      if (axios.isCancel(error)) return;
      console.error(error);
    });

  return () => controller.abort();
}, []);
```

The aborted request throws, so remember to swallow that specific error instead of showing it to the user.

## Timeouts

Neither one waits forever by default in a useful way. Axios has a `timeout` option in milliseconds:

```js
axios.get('https://jsonplaceholder.typicode.com/todos', { timeout: 5000 })
  .then(response => console.log(response.data))
  .catch(error => {
    if (error.code === 'ECONNABORTED') {
      console.log('The request timed out');
    }
  });
```

Fetch has no option, but you can pass `AbortSignal.timeout()` as the signal:

```js
fetch('https://jsonplaceholder.typicode.com/todos', { signal: AbortSignal.timeout(5000) })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => {
    if (error.name === 'TimeoutError') {
      console.log('The request timed out');
    }
  });
```

## Sending data

With fetch you serialise the body and set the header yourself. Forget the `Content-Type` and many APIs will reject the request:

```js
fetch('https://jsonplaceholder.typicode.com/todos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Write a blog post', completed: false })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

Axios does both for you when you hand it a plain object:

```js
axios.post('https://jsonplaceholder.typicode.com/todos', {
  title: 'Write a blog post',
  completed: false
}).then(response => console.log(response.data));
```

## Instances and interceptors

This is the real reason teams reach for Axios once an app grows. You create one configured client and every call inherits the base URL, the timeout, and the auth header — and you write the "token expired, log the user out" logic once instead of in every component.

```js
// src/api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
```

Your components then import that file instead of Axios directly:

```jsx
import client from '../api/client';

// inside useEffect
client.get('/todos').then(response => setTodos(response.data));
```

You can build the same thing on top of fetch — it's just a wrapper function you write and maintain yourself.

## So which one should you pick

For a small app with a handful of requests, use fetch. It's built into every modern browser and into recent versions of Node, it's zero bytes of dependency, and the only tax is remembering to check `response.ok`.

Reach for Axios once you have auth headers on every call, refresh-token logic, a dozen endpoints, or a team that will otherwise each invent their own wrapper. Paying for a dependency to delete that duplication is a good trade.

Two honest limits. First, Axios is a dependency you have to keep updated, and if you only ever make two GET requests it's weight you don't need. Second — and more important — neither of these solves caching, request deduplication, refetching on focus, or loading and error state. If you find yourself writing the same `useState` trio in every component, the answer isn't switching HTTP clients; it's a data-fetching library like React Query or SWR, which sits on top of either one.