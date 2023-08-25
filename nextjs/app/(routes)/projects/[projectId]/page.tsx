'use client'
import React from 'react';
import "@/app/_styles/main.css";

interface Props {
  params: {
    projectId: ProjectId
  }
}


export default function ProjectDashboardPage({ params }: Props) {
  return (
    <>
      <h1>Project: {params.projectId}</h1>
      <p>Dynamically do the things</p>
      <p>newest associated action plan and things like that</p>
    </>
  )
}
