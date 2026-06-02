import { Navbar } from "@/components/layout/Navbar";
import { Heart, Users, Zap } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />
      
      {/* Hero Section */}
      <div className="pt-32 pb-20 text-center px-4">
        <h1 className="text-5xl font-bold mb-6">Our Story</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          How PawsConnect was born from a chance encounter at a local animal shelter
        </p>
      </div>

      {/* Main Story Section */}
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        {/* Chapter 1 */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">The Beginning</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            In 2019, Ana Victoria Alentajan was volunteering at Riverside Animal Shelter when she witnessed a heartbreaking moment. A loving Golden Retriever named Max had been passed over by dozens of potential adopters—not because he wasn't special, but because his energetic personality didn't match the lifestyle of most visitors. Meanwhile, a young couple in their twenties who visited that same day walked out empty-handed, unable to find a dog that fit their active, outdoor-loving lifestyle.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            That moment sparked an idea. Ana called her best friend Mark Calimlim and told him what she'd witnessed. Mark, passionate about both animals and technology, immediately saw the potential. Together, they knew they could build something to solve this problem: What if there was a way to match pets with their perfect families before they even met?
          </p>
        </div>

        {/* Chapter 2 */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">The Challenge</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Ana and Mark began their mission by interviewing hundreds of adopters and shelter staff. They discovered the same problem repeated everywhere: the adoption process was outdated, inefficient, and often led to unsuccessful matches. About 47% of pets adopted from shelters were returned within the first year—many due to lifestyle incompatibility.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            As friends united by a shared vision, Ana brought her deep understanding of animal behavior and shelter operations, while Mark contributed his software engineering expertise. Together, they knew they could do better. They started building a platform that would analyze both pets and adopters to create meaningful connections.
          </p>
        </div>

        {/* Chapter 3 */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Launching PawsConnect</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            In 2021, Ana and Mark officially launched PawsConnect with a revolutionary AI-powered matching algorithm. The platform didn't just show you available pets—it evaluated your lifestyle, living situation, experience level, and preferences, then scored each pet on compatibility (out of 100 points).
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            The results were astounding. Within the first year, PawsConnect facilitated over 2,000 adoptions with a 94% success rate—meaning families kept their adopted pets. Max, that Golden Retriever from Ana's original inspiration, was adopted by the young couple and became the first success story featured in their platform.
          </p>
        </div>

        {/* Chapter 4 */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Today & Beyond</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            Today, Ana and Mark's PawsConnect works with over 500 animal shelters and rescues across the country. Their friendship-founded startup has helped over 50,000 pets find their forever homes. But they're just getting started. Their vision is to make every adoption a perfect match, to reduce shelter overcrowding, and to create communities of proud pet parents who are equipped to give their companions the best lives possible.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            Every day, Ana and Mark are reminded why they started this journey together: because every pet deserves the perfect home, and every family deserves the perfect companion.
          </p>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="bg-blue-50 py-16 mt-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Heart className="w-12 h-12 text-red-500" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">50,000+</div>
              <p className="text-gray-600">Pets Matched</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-blue-500" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">500+</div>
              <p className="text-gray-600">Partner Shelters</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Zap className="w-12 h-12 text-yellow-500" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">94%</div>
              <p className="text-gray-600">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center py-16 px-4">
        <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Match?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of happy families and find the companion that's perfect for your lifestyle.
        </p>
        <a href="/pets" className="inline-block bg-orange-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-600">
          Browse Pets
        </a>
      </div>
    </div>
  );
}