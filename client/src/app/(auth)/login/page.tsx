import { useState } from 'react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <>
      <div>
        <h2>Login</h2>
        <div>Image</div>
        <form></form>
      </div>
    </>
  );
}
