import { useState, type FormEvent, type ReactNode } from "react";
import {
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  Textarea,
  Input,
} from "@wheeler-works/ui-react";

const TYPES = [
  {
    value: "bug",
    label: "Bug report",
    placeholder: "What happened? What did you expect?",
  },
  {
    value: "feature",
    label: "Feature request",
    placeholder: "What would you like to see?",
  },
  { value: "other", label: "Other", placeholder: "What’s on your mind?" },
] as const;

// A "copy" of legionfall's FeedbackButton, adapted for this static site: pick a type, write a message
// (min 10 chars), optionally leave an email, send. Legionfall POSTs to its own /feedback server writing a
// JSONL file; there is no backend here, so Send writes the submission straight to Firestore (the
// `feedback` collection) under create-only security rules (see firestore.rules). Read submissions in the
// Firebase console.
export function FeedbackButton({
  children,
  triggerClassName = "hover:text-foreground",
}: {
  children?: ReactNode;
  triggerClassName?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const trimmed = message.trim();
  const short = trimmed.length < 10;
  const emailBad =
    email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const reset = () => {
    setType("bug");
    setMessage("");
    setEmail("");
    setBusy(false);
    setDone(false);
    setErr(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (short || emailBad || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const [{ getFirebaseApp }, { getFirestore, collection, addDoc, serverTimestamp }] =
        await Promise.all([
          import("../lib/firebase"),
          import("firebase/firestore"),
        ]);
      const db = getFirestore(getFirebaseApp());
      await addDoc(collection(db, "feedback"), {
        type,
        message: trimmed.slice(0, 4000),
        email: email.trim().slice(0, 200),
        page: window.location.href.slice(0, 300),
        userAgent: navigator.userAgent.slice(0, 400),
        createdAt: serverTimestamp(),
      });
      setDone(true);
      setTimeout(() => setOpen(false), 1400);
    } catch {
      setErr("Couldn’t send feedback — please try again.");
      setBusy(false);
    }
  };

  const ph = TYPES.find((t) => t.value === type)?.placeholder ?? "";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setTimeout(reset, 200);
      }}
    >
      <DialogTrigger className={triggerClassName}>
        {children ?? "💬 Feedback"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send feedback</DialogTitle>
          <DialogDescription>
            Bug, feature idea, or anything else — it comes straight to me.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <DialogBody>
            <p className="text-sm text-success-foreground">
              ✓ Thanks for your feedback!
            </p>
          </DialogBody>
        ) : (
          <form onSubmit={submit}>
            <DialogBody className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <Button
                    key={t.value}
                    type="button"
                    size="sm"
                    variant={type === t.value ? "default" : "outline"}
                    onClick={() => setType(t.value)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder={ph}
                autoFocus
              />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional — only if you’re open to follow-up questions)"
              />
              {emailBad && (
                <p className="text-sm text-destructive">
                  That email doesn’t look right — fix it or leave it blank.
                </p>
              )}
              {err && <p className="text-sm text-destructive">{err}</p>}
            </DialogBody>
            <DialogFooter className="justify-between">
              <span className="text-xs text-muted-foreground">
                {short
                  ? `${10 - trimmed.length} more character${
                      10 - trimmed.length === 1 ? "" : "s"
                    } needed`
                  : `${trimmed.length} characters`}
              </span>
              <Button type="submit" disabled={short || emailBad || busy}>
                {busy ? "Sending…" : "Send feedback"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackButton;
