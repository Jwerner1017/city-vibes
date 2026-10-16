import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { authClient, signOut } from "@/lib/auth/client";
import { SAVED_KEY } from "@/lib/constants";

export function DeleteAccountDialog() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsFreshSignIn, setNeedsFreshSignIn] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    setError(null);
    setNeedsFreshSignIn(false);
    const { error: err } = await authClient.deleteUser();
    if (err) {
      // Deleting needs a sign-in from the last day; older sessions get SESSION_EXPIRED.
      if (err.code === "SESSION_EXPIRED") {
        setNeedsFreshSignIn(true);
        setError("For your safety, sign in again, then tap Delete account.");
      } else {
        setError(err.message ?? "Could not delete account. Try again.");
      }
      setBusy(false);
      return;
    }
    // Clear only what the dialog promises. Trunk-or-treat edit links live on this
    // device (not the account) and can't be recovered, so they stay.
    try {
      localStorage.removeItem(SAVED_KEY);
    } catch {
      // Storage unavailable: nothing to clear.
    }
    window.location.href = "/";
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="h-12 w-full gap-2 rounded-xl" disabled={busy}>
          <Trash2 /> {busy ? "Deleting…" : "Delete account"}
        </Button>
      </AlertDialogTrigger>
      {error && <p className="mt-2 text-center text-sm text-destructive">{error}</p>}
      {needsFreshSignIn && (
        <Button
          variant="outline"
          className="mt-2 h-11 w-full rounded-xl"
          onClick={() => void signOut("/login")}
        >
          Sign in again
        </Button>
      )}
      <AlertDialogContent className="bg-surface">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account and clears saved events on this device. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
            Delete account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}