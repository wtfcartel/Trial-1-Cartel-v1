import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { completeModuleAction } from "@/lib/actions/induction";

export default async function InductionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "NURSE" || !user.nurseProfile) redirect("/dashboard");

  const [modules, progress] = await Promise.all([
    prisma.inductionModule.findMany({ orderBy: { order: "asc" } }),
    prisma.inductionProgress.findMany({ where: { nurseProfileId: user.nurseProfile.id } }),
  ]);
  const completedModuleIds = new Set(progress.map((p) => p.moduleId));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Induction training</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Complete every module below to become available for shifts. Each
        module is self-attested — mark it complete once you&apos;ve reviewed it.
      </p>

      <p className="mt-4 text-sm font-medium text-zinc-700">
        {completedModuleIds.size} of {modules.length} complete
      </p>

      <ul className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {modules.map((module) => {
          const done = completedModuleIds.has(module.id);
          return (
            <li key={module.id} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-zinc-900">{module.title}</p>
                <p className="text-sm text-zinc-500">{module.description}</p>
              </div>
              {done ? (
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Complete
                </span>
              ) : (
                <form action={completeModuleAction.bind(null, module.id)}>
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
                  >
                    Mark complete
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
