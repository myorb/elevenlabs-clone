import Link from "next/link";

export default function HomePage() {
  return <>
  <h1>For a landing page</h1>
    <div><Link href={'/app/sign-in'}> Login </Link></div>
  
  </>;
}
