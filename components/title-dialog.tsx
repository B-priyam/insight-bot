import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface Props {
  setTitle: (data: string) => void;
  isTitleModelOpen: boolean;
  setIsTitleModelOpen: (data: boolean) => void;
  title: string;
  action: () => void;
}

export function DialogDemo({
  isTitleModelOpen,
  setIsTitleModelOpen,
  setTitle,
  title,
  action,
}: Props) {
  return (
    <Dialog open={isTitleModelOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex justify-between">
            <div>
              <DialogTitle>Add Title</DialogTitle>
              <DialogDescription>
                Provide a title for your chat
              </DialogDescription>
            </div>
            <div className="hover:bg-slate-800/90 p-1 rounded-full h-6 cursor-pointer">
              <X
                onClick={() => setIsTitleModelOpen(false)}
                className="h-4 w-4"
              />
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-4 items-center gap-4"></div>
          <div className="md:flex items-center gap-4">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              defaultValue="kwljbwgnl"
              className="col-span-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => {
              action();
              setIsTitleModelOpen(false);
            }}
          >
            Save Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
