"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createSupabaseBrowserClient } from "@repo/backend/supabase/client";
import { Input } from "@repo/design-system/components/precomposed/input";
import { Textarea } from "@repo/design-system/components/precomposed/textarea";
import { Button } from "@repo/design-system/components/ui/button";
import { handleError } from "@repo/design-system/lib/handle-error";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";
import { createOrganization } from "@/actions/organization/create";
import { updateOrganization } from "@/actions/organization/update";

const formSchema = z.object({
  name: z.string().min(1),
  logo: z.instanceof(File).optional(),
  productDescription: z.string().min(1),
});

export const CreateOrganizationForm = () => {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      logo: undefined,
      productDescription: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await createOrganization({
        name: values.name,
        productDescription: values.productDescription,
      });

      if ("error" in response) {
        throw new Error(response.error);
      }

      if (values.logo) {
        const supabase = createSupabaseBrowserClient();
        const uploadResponse = await supabase.storage
          .from("organizations")
          .upload(response.id, values.logo);

        if (uploadResponse.error) {
          throw uploadResponse.error;
        }

        const { data: publicUrl } = supabase.storage
          .from("organizations")
          .getPublicUrl(response.id);

        const updateResponse = await updateOrganization({
          logoUrl: publicUrl.publicUrl,
        });

        if ("error" in updateResponse) {
          throw new Error(updateResponse.error);
        }
      }

      router.push("/");
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="grid w-full gap-4 rounded-lg border bg-background p-8 shadow-sm">
      <div className="grid gap-1 text-center text-sm">
        <h1 className="m-0 font-semibold text-lg">Create your organization</h1>
        <p className="m-0 text-muted-foreground">
          Welcome to Portal! Please fill in the details below to create your
          organization.
        </p>
      </div>
      <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          <Input placeholder="Acme" {...form.register("name")} label="Name" />
          {form.formState.errors.name?.message ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm">Logo</p>
            <p className="text-muted-foreground text-xs">Optional</p>
          </div>
          <Input
            accept="image/*"
            label={undefined}
            onChange={(event) => {
              form.setValue("logo", event.target.files?.[0], {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            type="file"
          />
          {form.formState.errors.logo?.message ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.logo.message}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Textarea
            placeholder="Acme is a platform for creating and managing products."
            {...form.register("productDescription")}
            label="Product Description"
          />
          {form.formState.errors.productDescription?.message ? (
            <p className="text-destructive text-sm">
              {form.formState.errors.productDescription.message}
            </p>
          ) : null}
        </div>
        <Button
          disabled={
            form.formState.disabled ||
            !form.formState.isValid ||
            form.formState.isSubmitting
          }
          type="submit"
        >
          Continue
        </Button>
      </form>
    </div>
  );
};
