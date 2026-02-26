import { Navbar } from "@/components/layout/Navbar";

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-32 text-center">
        <h1 className="text-4xl font-bold">About PetCard</h1>
        <p>This is where our story begins.</p>
      </div>
    </div>
  );
}