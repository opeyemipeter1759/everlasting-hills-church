export type Testimonial = {
  id: string;
  title: string;
  /** May contain multiple paragraphs separated by blank lines. */
  body: string;
  author: string;
};

/**
 * Single seam for testimonial data. Local seed today; swap the body for a server
 * fetch of the NestJS testimonials endpoint (mapping content → body) later without
 * touching the component. Trivial to extend: add an object to the array.
 */
export function getTestimonials(): Testimonial[] {
  return TESTIMONIALS;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "david-ade",
    title: "Both Encouraged and Convicted",
    author: "David Ade",
    body: `When I first walked into Everlasting Hills, I was carrying many questions and uncertainties. From my very first service, I sensed there was something special here. The worship was sincere and focused on glorifying God, and the preaching was deeply biblical.

For the first time in a long while, I left a service feeling both encouraged and convicted. Over the years I have grown through faithful teaching and real friendships with people who genuinely care about my walk with God.`,
  },
  {
    id: "emma-great",
    title: "More Than a Church",
    author: "Emma Great",
    body: `My journey with Everlasting Hills has been one of the most significant blessings in my life. I was welcomed with warmth and genuine love, and it did not take long to realise this was more than a church, it was a family.

Every sermon is grounded in the Bible and points us back to Christ. The messages are practical, helping me apply biblical principles to my marriage, family, and work. Through this community I have experienced the love of Christ in tangible ways.`,
  },
  {
    id: "sade-adeyemi",
    title: "A Home Through Every Season",
    author: "Sade Adeyemi",
    body: `Everlasting Hills has been a home for me through every season. The teaching has grounded my faith and the people have become family. I have grown here in ways I never expected, and I am still growing.`,
  },
  {
    id: "esther-oladipo",
    title: "No Pressure to Pretend",
    author: "Esther Oladipo",
    body: `As a young professional navigating life, I needed a church that combines biblical truth with practical guidance, and Everlasting Hills has provided exactly that. From the moment I joined, I was struck by the authenticity of the people. There was no pressure to pretend or perform.

The teaching ministry has had a profound impact on my life. Week after week I am challenged to think more deeply about God's Word and how it applies to every area of my life.`,
  },
  {
    id: "tunde-bakare",
    title: "Impartation of Spiritual Gifts",
    author: "Tunde Bakare",
    body: `Serving here has taught me that the church is not a crowd but a family that prays, grows, and stays. I came looking for a place to belong and found a place to give. Both have changed my life.`,
  },
];
