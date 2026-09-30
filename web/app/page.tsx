'use client';
import { useLang } from '../lib/useScene';
import Nav from '../components/Nav';
import Hero from '../components/Hero';

export default function Page(){
  useLang();
  return (
    <>
      <div id="sprog" aria-hidden="true"><i /></div>
      <Nav />
      <div className="site-reveal">
        <div className="bg-glass" aria-hidden="true" />
        <Hero />
      </div>
    </>
  );
}
