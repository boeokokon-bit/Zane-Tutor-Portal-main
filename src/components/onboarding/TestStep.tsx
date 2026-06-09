import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Clock, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function TestStep() {
  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-secondary" />
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-primary" /> Professional Proficiency Assessment
        </CardTitle>
        <CardDescription>
          Complete our comprehensive assessment to verify your subject mastery and digital proficiency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 w-full">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-success" /></div>
              <div>
                <p className="font-semibold text-sm">Subject Knowledge</p>
                <p className="text-xs text-muted-foreground">Detailed evaluation of your expertise in your chosen subjects.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-success" /></div>
              <div>
                <p className="font-semibold text-sm">Digital Teaching Skills</p>
                <p className="text-xs text-muted-foreground">Proficiency with virtual classrooms, digital whiteboards, and tools.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-1"><CheckCircle2 className="w-5 h-5 text-success" /></div>
              <div>
                <p className="font-semibold text-sm">Pedagogical Approach</p>
                <p className="text-xs text-muted-foreground">Teaching methodologies, patience, and student engagement scenarios.</p>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-5 flex flex-col justify-center items-center text-center border border-border">
            <Clock className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="font-bold text-lg mb-1">~15-20 Minutes</p>
            <p className="text-xs text-muted-foreground">Estimated time to complete all sections</p>
          </div>
        </div>

        <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 text-center">
          <p className="text-sm font-medium mb-4">
            This assessment is a critical step in our verification process. Your performance determines your ranking in the tutor catalogue.
          </p>
          <Link to="/assessment">
            <Button size="lg" className="w-full sm:w-auto px-10 gap-2 gradient-primary text-primary-foreground">
              Start Professional Assessment <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="w-4 h-4" />
          <span>You can pause and resume the assessment anytime.</span>
        </div>
      </CardContent>
    </Card>
  );
}
