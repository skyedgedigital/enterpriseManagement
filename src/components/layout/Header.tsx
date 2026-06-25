import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, User, ChevronDown } from "lucide-react";

import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { logoutUser } from "@/store/slices/authSlice";
import { canAccessPath } from "@/lib/rbac";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, role, roleStatus } = useAppSelector((state) => state.auth);

  const showProfile =
    user != null &&
    canAccessPath(role ?? null, roleStatus, "/profile");

  const handleLogout = async () => {
    const result = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(result)) {
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="app-header flex h-14 items-center gap-3 px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <Separator orientation="vertical" className="h-6 md:hidden" />
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline-block">
              {user?.email ?? "User"}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {showProfile && (
            <>
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
