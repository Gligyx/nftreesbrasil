import React from 'react';
import "@/app/_styles/main.css";

async function getData() {
  const fetchedList = ["ActionPlan1", "ActionPlan2", "ActionPlan3"];

  //if (!res.ok) { throw new Error('failed to something'); }

  //return res.json()
  return fetchedList
}


export default async function ActionPlanListPage() {
  const actionPlanList = await getData();

  return (
    <>
      <h1>Action Plan List</h1>
      <ul>
        {actionPlanList.map((actionPlan) => <li>
          {actionPlan}
        </li>)}
      </ul>
    </>
  )
}
