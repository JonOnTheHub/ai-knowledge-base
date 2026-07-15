import Link from "next/link"

export default function Footer() {
    const subject = encodeURIComponent('Interested in a Custom AI System')
    const body = encodeURIComponent(
        "Hi Jon,\n\nI came across a private AI knowledge base system you built and I'd like to talk about something similar for my business.\n\nCould we set up a quick call to go over how my team currently handles documents/workflows, so you can tell me what's possible?\n\nBusiness name:\nWhat we do:\nBest time to reach me:\n"
    )
    const mailtoHref = `mailto:johnnieosaghae@gmail.com?subject=${subject}&body=${body}`

    return (
        <footer className="mt-6 text-center">
            <Link
                href={mailtoHref}
                className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors"
            >
                Built by Jon — custom private AI systems for businesses
            </Link>
        </footer >
    )
}