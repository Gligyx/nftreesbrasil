import React, { useEffect, useState } from 'react';
import "@/app/_styles/main.css";

async function getData() {
  const fetchedList = ["Project One", "Project Two", "Project Three"];

  //if (!res.ok) { throw new Error('failed to something'); }

  //return res.json()
  return fetchedList
}


export default async function ProjectsPage() {
  const list = await getData();

  return (
    <>
      <h1>Active Projects</h1>
      <ul>
        {list.map((project) => <li>{project}</li>)}
      </ul>
    </>
  )
}
