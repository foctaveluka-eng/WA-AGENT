import { useGetOrganization, useGetOrganizationMembers, useUpdateOrganization, useInviteMember, getGetOrganizationQueryKey, getGetOrganizationMembersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus } from "lucide-react";

const orgSchema = z.object({
  name: z.string().min(1, "Name is required"),
  customDomain: z.string().optional(),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]),
});

export default function Organization() {
  const { data: org, isLoading: orgLoading } = useGetOrganization();
  const { data: members, isLoading: memLoading } = useGetOrganizationMembers();
  
  const updateOrg = useUpdateOrganization();
  const inviteMember = useInviteMember();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const orgForm = useForm<z.infer<typeof orgSchema>>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: "", customDomain: "" },
  });

  const inviteForm = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  });

  useEffect(() => {
    if (org) {
      orgForm.reset({ name: org.name, customDomain: org.customDomain || "" });
    }
  }, [org, orgForm]);

  const onOrgSubmit = (values: z.infer<typeof orgSchema>) => {
    updateOrg.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrganizationQueryKey() });
        toast({ title: "Organization updated" });
      }
    });
  };

  const onInviteSubmit = (values: z.infer<typeof inviteSchema>) => {
    inviteMember.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrganizationMembersQueryKey() });
        toast({ title: "Invitation sent" });
        inviteForm.reset();
      }
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-3xl font-bold tracking-tight">Organization</h1>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">Manage your team and company details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
          <CardDescription>Update your workspace settings.</CardDescription>
        </CardHeader>
        <CardContent>
          {orgLoading ? <Skeleton className="h-32" /> : (
            <Form {...orgForm}>
              <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-4 max-w-xl">
                <FormField
                  control={orgForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={orgForm.control}
                  name="customDomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Domain (Optional)</FormLabel>
                      <FormControl><Input placeholder="chat.yourcompany.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateOrg.isPending}>Save Details</Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage who has access to this workspace.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...inviteForm}>
            <form onSubmit={inviteForm.handleSubmit(onInviteSubmit)} className="flex items-end gap-4 p-4 border rounded-lg bg-muted/20">
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input placeholder="colleague@company.com" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="w-40">
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={inviteMember.isPending}>
                <Plus className="w-4 h-4 mr-2" />
                Invite
              </Button>
            </form>
          </Form>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memLoading ? (
                [1,2].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : members?.map(mem => (
                <TableRow key={mem.id}>
                  <TableCell>
                    <div className="font-medium">{mem.name}</div>
                    <div className="text-xs text-muted-foreground">{mem.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={mem.role === 'owner' ? 'default' : 'secondary'} className="capitalize">
                      {mem.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(mem.joinedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
