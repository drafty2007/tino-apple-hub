'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="section"><h1 style={{fontSize:40}}>We couldn’t load this page.</h1><p className="lead">Please try again. If this continues, contact the store administrator.</p><button className="button" onClick={reset}>Try again</button></section>;
}
