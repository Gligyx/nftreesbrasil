import Link from 'next/link';
import React from 'react';
import "../_styles/navigation.css";


export default function UnauthenticatedNav() {
  return (
    <nav>
      <ul id="navUl">
        <Link href={'/create-new-project'}   className="navElement">Create New Project</Link>
        <Link href={'/profile'} className="navElement">Profile</Link>
      </ul>
    </nav>
  )
}
