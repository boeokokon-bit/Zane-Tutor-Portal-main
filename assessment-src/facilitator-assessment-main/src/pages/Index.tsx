import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, BarChart3, ShieldCheck, ArrowRight, Users, Award, FileText } from 'lucide-react';
import Header from '@/components/layout/Header';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent" />
        
        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-primary/5 text-primary font-medium text-sm animate-fade-in border border-primary/10">
              ZaneTutors — Tutor Proficiency Assessment
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight animate-slide-up text-foreground">
              Demonstrate Your{' '}
              <span className="text-primary">Teaching Expertise</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Complete the proficiency assessment across your chosen subjects. Score 70% or above to qualify.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <Link to="/assessment">
                <Button 
                  size="lg" 
                  className="gradient-primary text-primary-foreground text-lg px-8 py-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Start Assessment
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in flex-wrap" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>~15 min per subject</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>20 questions per subject</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Instant results</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: BarChart3, title: 'Score Breakdown', desc: 'See your performance per subject' },
              { icon: ShieldCheck, title: '70% Threshold', desc: 'Clear pass/fail per subject' },
              { icon: CheckCircle, title: 'Choose Subjects', desc: 'Select your specialty areas' },
              { icon: Users, title: 'Admin Review', desc: 'Results sent to the team' },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="w-12 h-12 rounded-lg bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: '01', title: 'Fill Your Info', description: 'Enter your details and select the subjects you teach' },
              { step: '02', title: 'Answer Questions', description: '20 questions per subject testing your knowledge' },
              { step: '03', title: 'Get Results', description: 'Instant score with pass/fail status per subject' },
            ].map((item, i) => (
              <div key={i} className="relative animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="text-5xl font-black text-primary/10 mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-foreground">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg mx-auto">
            Take the assessment and prove your subject mastery.
          </p>
          <Link to="/assessment">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 rounded-xl shadow-lg"
            >
              Take Assessment Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">ZaneTutors</p>
          <p className="text-sm">Learn. Grow. Lead.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
