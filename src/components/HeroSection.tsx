import leftPart from '../assets/left-part.png'

export default function HeroSection() {
  return (
    <section className="fb-hero" aria-label="Facebook hero">
      <img
        src={leftPart}
        alt="Explore the things you love"
        className="fb-hero__img"
      />
    </section>
  )
}
