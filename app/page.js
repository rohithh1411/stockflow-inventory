import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard"); // middleware sends logged-out users on to /login
}
