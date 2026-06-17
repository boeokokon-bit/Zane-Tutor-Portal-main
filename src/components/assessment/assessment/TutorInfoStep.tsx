import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TutorInfo, Subject, TeachingLevel,
  SUBJECT_LABELS, TEACHING_LEVEL_LABELS, LEVEL_SUBJECTS 
} from '@/types/assessment';
import { BookOpen, GraduationCap, Beaker, School, University } from 'lucide-react';

interface TutorInfoStepProps {
  info: Partial<TutorInfo>;
  onChange: (info: Partial<TutorInfo>) => void;
}

const LEVEL_ICONS: Record<TeachingLevel, React.ReactNode> = {
  lower_primary: <BookOpen className="w-5 h-5 text-primary" />,
  upper_primary: <GraduationCap className="w-5 h-5 text-primary" />,
  junior_secondary: <Beaker className="w-5 h-5 text-primary" />,
  senior_secondary: <School className="w-5 h-5 text-primary" />,
  undergraduate: <University className="w-5 h-5 text-primary" />,
};

const TutorInfoStep = ({ info, onChange }: TutorInfoStepProps) => {
  const availableSubjects = info.teachingLevel 
    ? LEVEL_SUBJECTS[info.teachingLevel] 
    : [];

  const handleLevelChange = (level: TeachingLevel) => {
    onChange({ teachingLevel: level, selectedSubjects: [] });
  };

  const handleSubjectToggle = (subject: Subject) => {
    const current = info.selectedSubjects || [];
    const updated = current.includes(subject)
      ? current.filter(s => s !== subject)
      : [...current, subject];
    onChange({ selectedSubjects: updated });
  };

  const selectedCount = (info.selectedSubjects || []).length;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <BookOpen className="w-4 h-4" />
          Set Up Your Assessment
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Choose your level & subjects</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select the teaching level and subjects you'd like to be assessed on.
        </p>
      </div>

      {/* Teaching Level Card */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Teaching Level *</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Select the level you're being assessed for. This determines which subjects are available.
        </p>
        <div className="grid gap-3">
          {(Object.keys(TEACHING_LEVEL_LABELS) as TeachingLevel[]).map(level => {
            const isSelected = info.teachingLevel === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => handleLevelChange(level)}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all w-full
                  ${isSelected
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                  }
                `}
              >
                <span className="flex-shrink-0">{LEVEL_ICONS[level]}</span>
                <div className="flex-1">
                  <span className="font-semibold">{TEACHING_LEVEL_LABELS[level]}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {LEVEL_SUBJECTS[level].length} subjects available
                  </p>
                </div>
                {isSelected && (
                  <Badge variant="default" className="bg-primary text-primary-foreground">Selected</Badge>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Subject Selection */}
      {info.teachingLevel && (
        <Card className="p-6 border-2 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Select Your Subjects *</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Choose the subjects you want to be assessed on. You'll answer 20 questions per subject. You can skip between subjects freely.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableSubjects.map(subject => {
              const isSelected = (info.selectedSubjects || []).includes(subject);
              return (
                <label
                  key={subject}
                  className={`
                    flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer
                    ${isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40'
                    }
                  `}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleSubjectToggle(subject)}
                  />
                  <span className="font-medium text-sm leading-tight">{SUBJECT_LABELS[subject]}</span>
                </label>
              );
            })}
          </div>
          <p className={`text-sm mt-4 ${selectedCount >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
            {selectedCount >= 1
              ? `${selectedCount} subject${selectedCount > 1 ? 's' : ''} selected — ${selectedCount * 20} questions total`
              : 'Please select at least 1 subject'
            }
          </p>
        </Card>
      )}
    </div>
  );
};

export default TutorInfoStep;
