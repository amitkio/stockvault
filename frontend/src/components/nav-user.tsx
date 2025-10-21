import { IconDotsVertical, IconLogout } from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react"; // 1. Import hooks

export function NavUser() {
  const { isMobile } = useSidebar();
  const { logout } = useAuth();

  // 2. Create state to hold the username
  //    Give it a default value while it's loading.
  const [username, setUsername] = useState("Loading...");

  // 3. Get the token (this is fine)
  const token = localStorage.getItem("token");

  // 4. Use useEffect to fetch data when the component mounts
  useEffect(() => {
    // Make sure we actually have a token before fetching
    if (token) {
      fetch("http://localhost:5000/who", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch user");
          }
          return response.json();
        })
        .then((data) => {
          // 5. Update the state with the fetched username
          setUsername(data.username);
        })
        .catch((error) => {
          console.error("Error fetching user:", error);
          setUsername("Error"); // Show an error in the UI
        });
    }
    // 6. Add 'token' to the dependency array
    //    This means the effect will re-run if the token changes.
  }, [token]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                {/* You can use the first letter of the username for the fallback */}
                <AvatarFallback className="rounded-lg">
                  {username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {/* 7. This now reads the 'username' from state! */}
                <span className="truncate font-medium">{username}</span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem onClick={logout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
