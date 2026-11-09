import { redirect } from "next/navigation";

/** The app has two main pages; the old root URL goes to the first one. */
export default function Home() {
  redirect("/full-hedge");
}
