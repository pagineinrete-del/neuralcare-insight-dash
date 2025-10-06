import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Brain, Trophy } from "lucide-react";

interface CognitiveTestProps {
  onComplete: (score: number) => void;
  onCancel: () => void;
}

export function CognitiveTest({ onComplete, onCancel }: CognitiveTestProps) {
  const [phase, setPhase] = useState<"intro" | "memorize" | "recall" | "result">("intro");
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showSequence, setShowSequence] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const maxErrors = 3;

  const colors = [
    { id: 0, name: "Rosso", bg: "bg-red-500", hover: "hover:bg-red-600" },
    { id: 1, name: "Blu", bg: "bg-blue-500", hover: "hover:bg-blue-600" },
    { id: 2, name: "Verde", bg: "bg-green-500", hover: "hover:bg-green-600" },
    { id: 3, name: "Giallo", bg: "bg-yellow-500", hover: "hover:bg-yellow-600" },
  ];

  const generateSequence = (length: number) => {
    const newSequence: number[] = [];
    for (let i = 0; i < length; i++) {
      newSequence.push(Math.floor(Math.random() * 4));
    }
    return newSequence;
  };

  const startLevel = () => {
    const newSequence = generateSequence(level + 2);
    setSequence(newSequence);
    setUserSequence([]);
    setPhase("memorize");
    setShowSequence(true);
  };

  useEffect(() => {
    if (phase === "memorize" && showSequence) {
      let index = 0;
      const interval = setInterval(() => {
        if (index < sequence.length) {
          setActiveButton(sequence[index]);
          setTimeout(() => setActiveButton(null), 400);
          index++;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            setShowSequence(false);
            setPhase("recall");
          }, 800);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [phase, showSequence, sequence]);

  const handleColorClick = (colorId: number) => {
    if (phase !== "recall") return;

    const newUserSequence = [...userSequence, colorId];
    setUserSequence(newUserSequence);

    setActiveButton(colorId);
    setTimeout(() => setActiveButton(null), 300);

    const currentIndex = userSequence.length;
    if (colorId !== sequence[currentIndex]) {
      const newErrors = errors + 1;
      setErrors(newErrors);
      
      if (newErrors >= maxErrors) {
        const finalScore = Math.round((level - 1) * 20 + (score / level) * 10);
        setScore(finalScore);
        setPhase("result");
        toast.error("Test terminato! Hai commesso troppi errori.");
      } else {
        toast.error(`Errore! Hai ${maxErrors - newErrors} tentativi rimasti.`);
        setTimeout(() => startLevel(), 1500);
      }
      return;
    }

    if (newUserSequence.length === sequence.length) {
      const levelScore = 100;
      setScore(score + levelScore);
      setLevel(level + 1);
      toast.success(`Livello ${level} completato! +${levelScore} punti`);
      
      if (level >= 7) {
        const finalScore = Math.round(score + levelScore);
        setScore(finalScore);
        setPhase("result");
        toast.success("Complimenti! Hai completato tutti i livelli!");
      } else {
        setTimeout(() => startLevel(), 1500);
      }
    }
  };

  const handleFinishTest = () => {
    const finalScore = Math.min(100, Math.round(score / 7));
    onComplete(finalScore);
  };

  if (phase === "intro") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Test di Memoria Sequenziale
          </CardTitle>
          <CardDescription>
            Valuta la tua capacità di memorizzare sequenze di colori
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Come funziona:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Osserva attentamente la sequenza di colori che lampeggia</li>
              <li>Quando finisce, riproduci la stessa sequenza cliccando i bottoni colorati</li>
              <li>Ogni livello aggiunge un colore in più alla sequenza</li>
              <li>Hai {maxErrors} tentativi: dopo {maxErrors} errori il test termina</li>
              <li>Raggiungi il livello 7 per completare il test</li>
            </ol>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Annulla
            </Button>
            <Button onClick={startLevel}>
              Inizia Test
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "result") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Test Completato!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-primary">
              {Math.min(100, Math.round(score / 7))}
            </div>
            <p className="text-muted-foreground">
              Hai raggiunto il livello {level - (errors >= maxErrors ? 1 : 0)}
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Livelli completati</p>
                <p className="text-2xl font-bold">{level - 1}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Errori</p>
                <p className="text-2xl font-bold">{errors}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onCancel}>
              Chiudi
            </Button>
            <Button onClick={handleFinishTest}>
              Salva Risultato
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Livello {level}</CardTitle>
        <CardDescription>
          {phase === "memorize" && "Memorizza la sequenza..."}
          {phase === "recall" && "Riproduci la sequenza!"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="font-semibold">Punteggio:</span> {score}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Errori:</span> {errors}/{maxErrors}
          </div>
          <div className="text-sm">
            <span className="font-semibold">Sequenza:</span> {userSequence.length}/{sequence.length}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {colors.map((color) => (
            <button
              key={color.id}
              onClick={() => handleColorClick(color.id)}
              disabled={phase !== "recall"}
              className={`
                h-32 rounded-lg transition-all duration-200 transform
                ${color.bg} ${phase === "recall" ? color.hover : ""}
                ${activeButton === color.id ? "scale-95 brightness-125" : ""}
                ${phase !== "recall" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                disabled:cursor-not-allowed
              `}
              aria-label={color.name}
            />
          ))}
        </div>

        {phase === "recall" && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={onCancel}>
              Termina Test
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
