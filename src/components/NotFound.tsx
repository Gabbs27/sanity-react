
import AnimatedSection from "./common/AnimatedSection";
import SEO from "./common/SEO";
import NotFoundCard from "./card/NotFoundCard";
import usePageTracking from "../hooks/useAnalytics";

export default function NotFound() {
  usePageTracking();
  
  return (
    <>
      <SEO
        title="Page Not Found - 404"
        description="The page you're looking for doesn't exist."
        url="https://codewithgabo.com"
      />
      <div className='min-h-screen p-12'>
        <div className='container py-10'>
          <AnimatedSection variant="fadeInUp" duration={0.8}>
            <section className='greet-main mb-10'>
              <div className='greeting-main'>
                <div className='greeting-text-div'>
                  <NotFoundCard
                    name='Not Found'
                    description="Definitely Something's wrong"
                    title="Something's wrong"
                  />
                </div>
              </div>
            </section>
          </AnimatedSection>
        </div>
      </div>
    </>
  );
}
