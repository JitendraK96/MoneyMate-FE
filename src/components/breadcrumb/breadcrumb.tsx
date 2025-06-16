/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate } from "react-router-dom";

interface Route {
  name: string;
  to?: string;
}

export default function BreadcrumbWithCustomSeparator({
  breadcrumbs,
}: {
  breadcrumbs: Route[];
}) {
  const navigate = useNavigate();
  const routesLength = breadcrumbs.length;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbs.map((route, index) => {
          return (
            <>
              {routesLength !== index + 1 ? (
                <BreadcrumbItem className="cursor-pointer">
                  <BreadcrumbLink asChild>
                    <span
                      className="text-[var(--content-textplaceholder)] font-size-extra-small hover:text-[var(--content-textprimary)]"
                      onClick={() => route?.to && navigate(route?.to)}
                    >
                      {route.name}
                    </span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              ) : (
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-size-extra-small text-[var(--content-textprimary)]">
                    {route.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              )}

              {routesLength !== index + 1 && (
                <BreadcrumbSeparator className="text-[var(--content-textplaceholder)]" />
              )}
            </>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
