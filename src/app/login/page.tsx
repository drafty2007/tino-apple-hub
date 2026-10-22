import PasswordField from "./password-field";
import { login } from './actions';
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <section className="auth"><p className="eyebrow">Your account</p><h1>Welcome back.</h1><p className="lead">Sign in to your Tino Apple Hub account.</p>{error && <p className="error" role="alert">Unable to sign in. Check your email and password.</p>}<form action={login}><label>Email address<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><PasswordField/><button className="button" type="submit">Sign in</button></form><p className="notice">Store owners: create your first account using the secure local setup command in the README.</p></section>;
}

