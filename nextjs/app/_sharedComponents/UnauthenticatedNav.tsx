import Link from 'next/link';
import React from 'react';
import "../_styles/navigation.css";


export default function UnauthenticatedNav() {
  return (
    <nav>
      <ul id="navUl">
        <Link href={'/experimental-area'} className="navElement">First Experiment</Link>
        <Link href={'/experimental-area-2'} className="navElement">Second Experiment</Link>
        <Link href={'/profile'} className="navElement">Profile</Link>
      </ul>
    </nav>
  )
}
