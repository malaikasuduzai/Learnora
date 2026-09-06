"use client";
import { BarChartIcon, BookOpenIcon, ClipboardListIcon, PaletteIcon } from "@/components/icons";
const ITEMS=[
{icon:BookOpenIcon,title:"Course learning",body:"Keep course content, progress and learning activity organized.",accent:"#2568f5"},
{icon:PaletteIcon,title:"UI/UX",body:"Use a clear, consistent interface that is easier to navigate on every screen.",accent:"#0f7a5d"},
{icon:ClipboardListIcon,title:"Tasks",body:"Keep assignments, submissions and deadlines visible and easy to manage.",accent:"#b8842e"},
{icon:BarChartIcon,title:"Progress",body:"Use real platform data to understand learning activity and performance.",accent:"#a9691c"},
];
export default function OverviewHighlights({role="dashboard"}){return <section>
  <div className="mb-4">
    <p className="eyebrow">Dashboard experience</p>
    <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">A clearer {role.toLowerCase()} workspace</h2>
    <p className="mt-1 text-xs leading-relaxed text-ink-500">Key areas are grouped into simple, responsive cards so important actions are easier to find.</p>
  </div>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {ITEMS.map(({icon:Icon,title,body,accent})=>
      <div key={title} className="tile-card group" style={{"--tile-accent":accent}}>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition duration-300 group-hover:scale-105"
          style={{backgroundColor:accent}}
        >
          <Icon className="h-5 w-5"/>
        </span>
        <h3 className="mt-4 text-sm font-semibold text-ink-900">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{body}</p>
      </div>
    )}
  </div>
</section>}
