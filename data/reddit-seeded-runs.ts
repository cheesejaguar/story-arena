import type { ModelSlug } from "@/lib/ai/models";
import type { RedditSeedRun, RedditSeedStory } from "@/lib/seed/reddit-seed";
import { REDDIT_WRITING_PROMPTS } from "@/data/reddit-writing-prompts";

const SLOT_PERMUTATIONS: Array<Record<"A" | "B" | "C", ModelSlug>> = [
  {
    A: "openai/gpt-5.4",
    B: "anthropic/claude-opus-4.6",
    C: "google/gemini-3.1-pro-preview",
  },
  {
    A: "openai/gpt-5.4",
    B: "google/gemini-3.1-pro-preview",
    C: "anthropic/claude-opus-4.6",
  },
  {
    A: "anthropic/claude-opus-4.6",
    B: "openai/gpt-5.4",
    C: "google/gemini-3.1-pro-preview",
  },
  {
    A: "anthropic/claude-opus-4.6",
    B: "google/gemini-3.1-pro-preview",
    C: "openai/gpt-5.4",
  },
  {
    A: "google/gemini-3.1-pro-preview",
    B: "openai/gpt-5.4",
    C: "anthropic/claude-opus-4.6",
  },
  {
    A: "google/gemini-3.1-pro-preview",
    B: "anthropic/claude-opus-4.6",
    C: "openai/gpt-5.4",
  },
];

type SeedStorySet = {
  permutation: number;
  textByModel: Record<ModelSlug, string>;
};

function makeStories(seed: SeedStorySet): [RedditSeedStory, RedditSeedStory, RedditSeedStory] {
  const mapping = SLOT_PERMUTATIONS[seed.permutation];
  if (!mapping) {
    throw new Error(`Unknown slot permutation index: ${seed.permutation}`);
  }

  return (["A", "B", "C"] as const).map((slot) => ({
    slot,
    modelSlug: mapping[slot],
    text: seed.textByModel[mapping[slot]],
  })) as [RedditSeedStory, RedditSeedStory, RedditSeedStory];
}

const SEEDED_STORIES: SeedStorySet[] = [
  {
    permutation: 0,
    textByModel: {
      "openai/gpt-5.4": `Bob Ross set his paint box on the rickety table and smiled as though the room had not been full of knives a moment earlier.

“Son,” he said, looking at the furious young man in the paint-stained smock, “you got yourself a lot of dark colors in here. Nothing wrong with dark. You just need some light to talk to it.”

Adolf Hitler sneered, then hesitated. Ross moved his hand in small, patient circles over the canvas. Clouds. A river. Pines dusted with snow. “Happy little trees,” he whispered.

Outside, another time traveler aimed a rifle through the boardinghouse window. Ross never looked up. “You can spend your whole life trying to dominate a picture,” he said, “or you can learn to listen to it.”

The shot never came. The assassin stood there crying instead.

Twenty years later Europe did not march under banners. It traveled by train to a quiet museum in Vienna to see the melancholy landscapes of an artist history had once been afraid to lose.`,
      "anthropic/claude-opus-4.6": `The strangest thing about the visitor was not his clothes, or the impossible device humming beneath them, or even the way Adolf reached for the carving knife the instant he saw him.

It was the gentleness.

“I am not here to kill you,” the stranger said, setting down a fan brush as reverently as a priest laying out silver. “Too many men have tried to fix the future with murder. I came to try mercy.”

He painted from memory: blue mountains, humble cabins, sunlight trembling on water. Adolf watched as if the canvas were a door.

“Why this?” he asked at last.

“Because a man who learns to love proportion, patience, and light may someday prefer beauty to grievance.”

The lesson lasted three days. The assassins waiting in alleys and attics never got their chance. By the end, Adolf had stopped talking about destiny and started arguing about shadows.

Years later his alpine scenes hung in ordinary homes. History, deprived of one hungry ego, grew less theatrical and far less cruel.`,
      "google/gemini-3.1-pro-preview": `Adolf had become excellent at spotting time travelers. They always wore boots too practical for the season and looked at him the way butchers inspect livestock.

So when the hooded stranger entered and asked to see his paintings, Adolf grabbed the fire poker before the man could reach for a futuristic weapon.

Instead, the stranger revealed a round face, a great frizzy halo of hair, and a smile so tranquil it felt like witchcraft.

“My name’s Bob,” he said. “I hear you’ve been having a rough time with critics. Mind if I show you a mountain trick?”

He painted quickly, as if the forest already existed inside the blank canvas and merely needed inviting out. Adolf forgot the poker. Forgot the insults. Forgot the speech he had been composing all morning about betrayal and blood. There was only the slope of a hill, the mercy of reflected light, the possibility that mistakes could be painted over.

When the next assassin burst in, Adolf shouted, genuinely offended, “Can’t you see I’m learning trees?”`,
    },
  },
  {
    permutation: 1,
    textByModel: {
      "openai/gpt-5.4": `The first thing I saw was color.

Not shapes. Not people. Color. A bruised blue wall. Rust on the radiator. The hard yellow of morning stabbing through blinds I had forgotten existed.

Then the words hit me.

DON'T TELL THEM YOU CAN SEE.

They were painted on every surface of my apartment in the same shaky black hand. Floorboards. Ceiling. Mirror. Even my own forearm, though whoever had written there had been careful not to break skin.

In the hallway I heard Mrs. Alvarez tapping her cane and humming. On the street below, hundreds of white canes clicked like insects. The blind had rebuilt the city by sound.

A knock came at my door. Three slow raps.

“Census,” said a cheerful voice. “Any changes in your condition?”

I looked through the peephole and nearly screamed. The man’s smile was normal.

His eyes were not. They were full of moonlight, though the sun was up.

I stepped back from the door and answered in the old, practiced dark.

“No change,” I said.`,
      "anthropic/claude-opus-4.6": `Sight returned like a wound reopening.

I had forgotten how violent light could be. How merciless edges were. The room appeared all at once: the bed I had learned by touch, the chipped enamel sink, the tiny green plant on the sill somehow still alive. And everywhere, covering wall and floor and lamp and door in desperate black strokes, the same sentence.

DON'T TELL THEM YOU CAN SEE.

For a long moment I only stood there, weeping at color.

Then I heard singing outside. Not music—coordination. Hundreds of voices moving together in the street below. I parted the curtain a sliver.

The neighborhood was painting again. Blind men and women with rollers, guided by those thin silver things perched on their shoulders, whispering into their ears.

One of the silver creatures lifted its head. Though it had no face, I felt it notice me through the glass.

That was when I understood the message was not paranoid. It was loving.

Someone who had seen before me had spent their last free hour warning the next person to wake.`,
      "google/gemini-3.1-pro-preview": `I could see for exactly six minutes before my husband came home.

In those six minutes I learned three things.

First: whoever had restored my vision had also repainted our apartment with a single command—DON'T TELL THEM YOU CAN SEE—in tar-black letters big enough for panic.

Second: the city had changed more than I imagined. The sidewalks were braided with guide ropes. Traffic lights chirped hymns instead of tones. People moved confidently, but only because every intersection had a pale statue posted on it.

Third: the statues were not statues.

When Daniel opened the door, smiling in the direction of my chair, one of the things outside tilted its head the exact same way. Listening.

“How’s the dark today?” he asked softly.

I forced my eyes unfocused. “Same as always.”

He relaxed. Too much.

That night, after he fell asleep, I watched him lift his hand in dreams and trace letters on the blanket.

DON'T.

TELL.

THEM.

He could see too.`,
    },
  },
  {
    permutation: 2,
    textByModel: {
      "openai/gpt-5.4": `In 2038, the poor didn't ask for freedom online. They asked whether freedom came with ads.

Every streetlamp in Boston had a login portal. Premium air filters required a family plan. Public school history classes buffered after the first paragraph unless districts paid the Heritage Plus bundle.

So when we stole the Chronolink prototype, nobody argued about where to go.

“2017,” I said. “Before they sold the future one subscription at a time.”

We arrived behind a strip mall in New Jersey carrying forged badges from the Federal Communications Commission and a hard drive full of screenshots from our century: emergency services locked behind microtransactions, voting portals throttled on election day, hospice chat windows interrupted by unskippable brand messages.

The man we needed wasn't a senator. He was a bored network engineer named Luis, eating noodles at 2:14 a.m.

We showed him the archive.

He didn't speak for a long time. Then he looked at the graphs, at the sponsor watermark crawling across a hospital ventilator interface, and said, “Tell me exactly who to call.”

History changed, not with a speech, but with one tired technician deciding a cable should remain a cable.`,
      "anthropic/claude-opus-4.6": `By 2038, the internet had become weather: something vast, necessary, and owned by men who sold umbrellas.

Our neighborhoods lived in permanent drizzle. Messages arrived blurred unless you paid for clarity. News came with delays, music in low bitrate, love in stuttering fragments. The rich streamed in sunlight.

We did not go back in time to kill anyone. There was no villain singular enough for that. We went back to save a principle before it had a grave.

The machine dropped us in 2017 beside a convenience store humming with fluorescent innocence. Cars still had steering wheels. People still believed convenience would naturally remain cheap.

At the hearing we were not allowed to enter, so we stood outside and handed strangers printed pages from our future: throttled fire maps, tiered emergency calls, classrooms frozen behind paywalls.

A girl in a varsity jacket read one page, went pale, and took a photo. Then another person did. Then twenty.

History, we learned, is sometimes rerouted not by governments but by enough ordinary hands refusing to click “I accept.”`,
      "google/gemini-3.1-pro-preview": `The trick to time travel is choosing the smallest lever.

In our century, activists kept aiming for presidents, CEOs, and courtroom miracles. Those were big levers, theatrical levers, the kind that snap. I aimed for a county librarian in Ohio on a Tuesday in 2017.

Her name was Naomi. She supervised six public computers and one civic fiber grant nobody else in town cared about.

I found her shelving books.

“You don't know me,” I said, placing a tablet in her hands. On it looped footage from 2038: parents gathered outside the Learning Platinum terminal, unable to afford access to first-grade homework; paramedics cursing at a payment wall; dissidents shouting into upload caps.

“This happens if the internet becomes cable,” I told her.

She watched the whole thing. Then she took out her phone, called three journalists, and said the phrase every corporate lobbyist fears: “I have documents and local outrage.”

Twenty-one years later our archives listed her as a footnote.

That was enough. In my timeline, children could still breathe without buffering.`,
    },
  },
  {
    permutation: 3,
    textByModel: {
      "openai/gpt-5.4": `The audience's applause rolled through the concrete launch bay like surf.

Blofeld had built the place in a desert bowl, all polished steel and theatrical lighting, half space program and half coliseum. My captors fastened the helmet ring with almost loving precision. In the middle distance stood the car—one of his own prototypes—mounted on rails pointed at the stars.

“I’ll tell you what I’m going to do, Mr Bond,” he said over the loudspeakers, savoring every syllable the way vain men savor mirrors.

I let him finish. Villains are rarely so vulnerable as when they've finally reached the part they rehearsed.

Q's emergency transmitter was stitched into my cuff. I thumbed it twice. The Aston prototype on the launch cradle woke, accepted a hidden overwrite, and reclassified its passenger as unauthorized cargo.

When the clamps released, the vehicle did not ascend. It spun neatly, corrected, and drove itself back down the rails at a speed that made even Blofeld lose his diction.

The applause grew louder as it carried him through his own blast doors.

The last thing I heard before the smoke took the room was indeed the crowd cheering.

Just not for the man he expected.`,
      "anthropic/claude-opus-4.6": `He was right about one thing: mankind was watching.

Above us, screens bloomed with faces from every capital city, all invited to witness the age's most expensive act of vanity. I stood strapped inside the suit, already tasting my own breath, while Blofeld paced beneath the gantry like an impresario before curtain rise.

“I want you to understand the elegance of it,” he said, voice softened by triumph. “No bullet. No hidden knife. A pageant.”

He had never understood that spectacle is only power while the audience accepts the script.

The radio in my helmet crackled. Not Q. Moneypenny.

“James,” she said, “we have the global feed.”

I smiled, barely. “Then let him hear them.”

The launch countdown began. At three, the screens behind Blofeld changed. His shell companies. His bombings. His photographs with ministers who had sworn they had never met him. All exposed at once. The applause he heard was real, but it was for the fall of a tyrant being watched live.

He looked up, offended, just as the car's restraints released without me inside it.

I had been standing behind him for seven seconds.`,
      "google/gemini-3.1-pro-preview": `“The last thing you'll hear,” Blofeld promised, “will be their applause.”

That was the only part of the plan that annoyed me.

He had mistaken noise for consent. The grandstands around the launch tunnel were packed not with admirers but with investors, blackmailed scientists, and celebrities too frightened to leave. Their clapping was obedience with better tailoring.

As technicians bolted me into the car, I noticed the radio frequency on the dashboard. Blofeld loved symmetry; he had tuned it to the same private band he used for internal security. I angled my helmet mic and spoke one sentence.

“Fire suppression protocol: test all nozzles.”

The system obeyed.

Foam flooded the tunnel. Searchlights died. The applause broke into coughing chaos. In the dark, the car's electric motors hummed beneath me like a polite animal awaiting permission.

I released the manual brake, turned the wheel, and drove straight through the side curtain of the stage into open desert.

As I accelerated under the stars, the radio carried one final burst from the arena—wild cheering, but not for my death. Someone had put Blofeld himself on the launch rail.

Good people can be surprisingly quick learners.`,
    },
  },
  {
    permutation: 4,
    textByModel: {
      "openai/gpt-5.4": `At 3:02 a.m. the phone screamed.

EMERGENCY ALERT: DO NOT LOOK AT THE MOON.

The message was so absurd I almost laughed. Then the second alert hit, and the third, and my notifications turned into a river of strangers pleading with me to go to the window.

Beautiful night tonight.
Look outside.
You're missing it.

I shut every blind in the apartment and backed into the bathroom. No windows. One weak bulb. My hands shook so hard I dropped the phone in the sink.

Then came the knock from next door.

“Maya?” old Mrs. Kim called. “Honey, don't answer anyone if they sound happy.”

That sentence chilled me more than the alert. Mrs. Kim never sounded afraid.

We sat on opposite sides of the wall and listened to the building change. Doors opening. Bare feet in hallways. A dozen soft voices all saying the same thing in the same gentle tone: “Just one look.”

Near dawn my phone camera accidentally flipped to selfie mode. Over my shoulder, in the black rectangle of the curtained window, there was a pale round shape pressed against the glass from the outside.

The moon, I realized, was not in the sky anymore.`,
      "anthropic/claude-opus-4.6": `The alert woke everyone at once. You could hear it in the city: thousands of phones shrieking through walls, through towers, through sleeping throats.

DO NOT LOOK AT THE MOON.

There are messages that sound ridiculous until the world immediately obeys them. Curtains hissed shut all along the block. Somewhere below, brakes screamed. Somewhere farther off, a child began to cry and was hushed too fast.

My screen filled with texts from numbers I did not know.

It's beautiful.
You should see what it's doing.
Come to the roof.

I put the phone face down and crawled to the kitchen, where my grandmother was already sitting at the table tying a dish towel over her eyes.

“Nan?”

She did not look up. “In 1968,” she said quietly, “the government called it a weather balloon. We called it the Harvesting.” She pushed another towel toward me. “This time they remembered to warn us.”

We waited together in the dark while something bright and patient moved over the building, trying every window in turn.`,
      "google/gemini-3.1-pro-preview": `By 3:05 a.m., every screen in the apartment was broadcasting the same black background and white command.

DO NOT LOOK AT THE MOON.

By 3:07, my brother Tyler called laughing. “Dude, they can't tell us what sky to look at.”

“Tyler, don't—”

He hung up.

At 3:09 he sent a photo from his balcony. The city skyline, a silver disk above it, and one caption: wow.

I never saw the image. The alert software blurred any direct capture before it finished rendering. But the call that followed came from Tyler's number, and the voice on the line was not my brother's. It was too calm, too warm, like a nurse speaking to a feverish child.

“It's safe,” it said. “The moon just wants to be acknowledged.”

I smashed the phone, pulled the blackout curtains tight, and sat trembling until dawn.

When the sun rose, every bird in the neighborhood was dead on the sidewalks, arranged nose-first toward the west. Tyler's balcony door stood open.

There were no footprints leaving it. Only the faint chalky print of a circle on the concrete, as if the night itself had set a cup there and taken it away.`,
    },
  },
  {
    permutation: 5,
    textByModel: {
      "openai/gpt-5.4": `Death turned out to have carpet.

A thick burgundy aisle ran between rows of cinema seats toward a screen the size of a cathedral wall. In the dim light I counted fourteen people already there, all of them versions of me. One had tattooed knuckles. One wore armor. One was a woman with my mother's eyes and my own crooked smile. They all looked up at once with the awkwardness of relatives meeting before a funeral.

“You're Number Fifteen,” said an old man who was also me, though much older than I had ever managed.

“What's playing?” I asked.

“Your next life.”

The projector flared. On the screen a child opened its eyes in a village of red dust and salt wind. Instantly the theater changed. The woman beside me began to sob. The tattooed one laughed with joy. The old man gripped my arm hard enough to hurt.

“Why are you all reacting like this?”

“Because,” he said, never looking away, “this is the one where we finally remember enough to be kind in time.”`,
      "anthropic/claude-opus-4.6": `The first shock was that I was not alone.

The second was how familiar everyone's posture felt. The man two rows ahead leaned exactly the way I did when listening hard. The child by the aisle worried a thumbnail the same nervous way. The stern woman in the back had my face if life had taught it greater discipline.

We were every draft of a soul.

The theater smelled of dust and velvet and rain beginning somewhere very far away. No one explained the rules because no one needed to. When the screen brightened, silence moved through us like a held breath.

A baby cried into being.

I felt recognition pass from row to row as the next life unfolded: its mother poor, its world hard, its choices already branching toward mercy or fear. Beside me, a previous self whispered, “This one gets another chance at the man on the bridge.”

Only then did I understand why reincarnation required witnesses. Memory does not travel cleanly, but longing does.

We watched with all the fierce tenderness of ancestors praying for a stranger who had always been us.`,
      "google/gemini-3.1-pro-preview": `The ticket stub in my hand read SCREEN 7.

It also read ALL OF YOU.

Inside the theater sat twenty-three people, ranging from child to crone to what looked suspiciously like a Bronze Age shepherd. Every one of them had my eyes. The shepherd squinted at me and muttered, “Again?”

Before I could demand answers, the lights dimmed. A title card appeared.

LIFE 24.

Onscreen, a girl in a flooded coastal city was born under emergency generators. The room reacted like sports fans watching a final match. One version of me covered his face at age eight. Another cheered when the girl refused a bribe at sixteen. The shepherd booed a merchant in scene three and was delighted to be proven right later.

“Are we judging her?” I whispered.

An elderly version of me shook her head. “We're giving her momentum.”

At the climax, when the girl chose to pull a stranger from black water instead of saving the case that would make her rich, the whole theater rose in thunderous applause.

For the first time since dying, I understood hope as a collective act.`,
    },
  },
  {
    permutation: 0,
    textByModel: {
      "openai/gpt-5.4": `I hired them for different reasons, though I only admitted one to myself.

Leah was to arrive first, elegant and sharp, my “colleague from the bank.” Daniel would arrive ten minutes later, same story. I would sit at the next table in the back corner and listen while two attractive strangers improvised the life I had always meant to build.

That was the lie, anyway.

The truth was simpler: I wanted to know what people might say about me if they thought I wasn't there.

Leah ordered wine. Daniel arrived rain-damp and apologetic. Within two minutes they had established they worked in compliance, that I was brilliant but lonely, and that my shoes suggested a man who trusted rules more than joy.

Then they stopped playing the assignment.

“You know he's listening, right?” Leah said.

Daniel glanced toward my table without turning his head. “Of course.”

“Should we be mean?”

Daniel considered. “No. He paid for fiction. Let's give him a kinder one to grow into.”

For the next hour they described a version of me who laughed easily, called his sister back, and knew when to leave work before midnight.

I listened as if eavesdropping on a future.`,
      "anthropic/claude-opus-4.6": `By dessert they had abandoned every detail I paid for except the central mercy of pretending.

She was no longer a banker from Canary Wharf. He was no longer an analyst from some invented branch office. Instead they became, together, two strangers gently reconstructing the shape of the man at table twelve.

“He holds his shoulders like apology,” the woman said, cutting into her pear tart.

“He watches the door every time it opens,” the man replied. “As if someone important once forgot to arrive.”

I stared at my untouched coffee.

I had hired them because loneliness becomes embarrassing when spoken plainly. I told myself I wanted entertainment, a private little theater. What I had actually purchased was witness.

The woman smiled toward the candle between them. “I think he wants to believe he is impossible to love before anyone has the chance to disprove it.”

The man lifted his glass toward my reflection in the window. “Then let's make sure that's not the story he leaves with.”

When I stood to go, they both looked up and nodded as if we had all agreed to honesty.`,
      "google/gemini-3.1-pro-preview": `I expected awkwardness. I did not expect chemistry.

Within fifteen minutes, the woman I'd hired and the man I'd hired were doing a better job enjoying dinner together than I had done with anyone in years. Their fake corporate small talk gave way to real jokes, then to a surprisingly passionate debate about whether cities should have curfews for hedge funds.

I should have been offended. Instead I kept listening.

When the waiter cleared the mains, the man lowered his voice. “So, what do you think of our mysterious sponsor?”

The woman's eyes flicked once to my reflection in the mirrored pillar. “I think he's sad enough to invent an alibi before he invents a conversation.”

“Ouch.”

“Accurate, though. Also kind eyes. Terrible plan.”

They decided, with the brisk professionalism of experts, that I required intervention. Five minutes later the woman rose, walked to my table, and sat down without asking.

“Change of service,” she said. “For the rest of the evening, you're joining us. No pretending.”

It was the most expensive and most useful therapy session of my life.`,
    },
  },
  {
    permutation: 1,
    textByModel: {
      "openai/gpt-5.4": `The reason the world knows about Japanese ninjas is not because Japan invented them.

It's because Japan lost a trade dispute in 1643 and retaliated by turning covert action into theater.

They published manuals. They wore uniforms. They leapt across rooftops in moonlight and shouted things that no professional assassin should ever shout. The rest of us were appalled. The cover of secrecy was ruined forever.

I learned this on my first day at the International Department of Customs, when an Italian woman in a cream suit handed me a badge and whispered, “If anyone asks, you're processing citrus.”

That night she took me below Geneva Airport into a vault where ninety-three delegates sat behind identical black screens. No flags. No names. Only styles.

The Canadian moved silently enough to make the air embarrassed. The Ghanaian had disguised an entire briefing as a hymn. The Japanese representative arrived late, tripped over a cable, and apologized into three microphones.

Nobody laughed.

Their job, I discovered, was not incompetence. It was camouflage. While the world watched Japan's ninjas fail loudly on rooftops, everyone else's passed through locked nations like a change in weather.`,
      "anthropic/claude-opus-4.6": `Every nation has shadows. Japan simply had the bad taste to brand theirs.

My grandfather used to say this with the affectionate irritation one reserves for a brilliant cousin who insists on performing card tricks at funerals. When I was old enough, he took me to the old exchange house in Kyoto where the world's hidden services met once a decade beneath paper lanterns and ritualized complaints.

The Russians were gardeners. The Peruvians specialized in avalanche routes. The Nigerians preferred rumor to blade. The Icelanders could make a person disappear so thoroughly that even memory developed frostbite.

Then the Japanese host arrived dressed head to toe in historic absurdity, face masked, swords polished, every movement a cliché. The room groaned.

“He is playing his part,” Grandfather murmured.

Outside, tourists bought ninja keychains and took pictures under the lanterns. Inside, treaties were amended and coups quietly prevented.

The world only knows Japan's ninjas because those ninjas agreed, generations ago, to become the joke that protected everyone else's silence. There is a kind of patriotism in volunteering to be underestimated forever.`,
      "google/gemini-3.1-pro-preview": `I was posted to Tokyo because I failed a stealth exam in spectacular fashion.

My instructor called it a punishment assignment. “Observe the amateurs,” she said. “Maybe their confidence will shame you into competence.”

Then I saw the operation.

A Japanese team in full storybook costume sprinted across tiled roofs at midnight, setting off alarms with such enthusiasm that half the district woke up to livestream them. Police cars converged. Helicopters circled. The internet exploded with commentary about how ridiculous ninjas were in the modern age.

Meanwhile, beneath the noise, a Kenyan operative walked through the embassy disguised as the vending machine repairman. A Brazilian courier retrieved the stolen microfilm through a storm drain. A soft-spoken woman from Finland altered three server backups and left without anyone remembering her face.

At dawn, my instructor handed me tea.

“Understand now?” she asked.

Japan's ninjas weren't the worst in the world.

They were the best at taking credit for everyone else's work.`,
    },
  },
  {
    permutation: 2,
    textByModel: {
      "openai/gpt-5.4": `We thought the aliens had broken the world.

In fairness, they had broken most of it. Cities cratered. Satellites stripped from orbit. Half of humanity gone before the third week. The survivors clustered in dark valleys and subway tunnels, counting canned food and grief.

Then little Mara in Shelter Twelve lifted a rusted spoon without touching it.

No one cheered. We were too tired for miracles.

I had been a statistics lecturer before the invasion, which made me the sort of useless person apocalypse often keeps around by accident. So I did what I knew: I counted. Population estimates. Historical myths. Reports of impossible events. As the numbers fell, the incidents rose.

Mana, the old stories had claimed, was diluted by crowds. We had laughed because there had always been too many of us to test the math.

By winter, the soldiers carried rifles in one hand and weather spells in the other. By spring, the dead orchards were blooming under whispered instructions. When the alien walkers returned, old women traced symbols in the air and folded gravity like laundry.

Humanity had not regained an ancient power.

It had finally become rare enough to hear itself.`,
      "anthropic/claude-opus-4.6": `Magic did not arrive with thunder. It arrived like memory.

In the camp outside Kraków, the survivors slept under torn canvas while the stars burned through the holes. Around midnight a grandmother named Irena stood from her cot, touched the frozen water barrel, and asked it—not commanded, asked it—to boil.

It obeyed.

No one spoke for several seconds. Then everyone did at once.

The old stories, once dismissed as pre-scientific metaphors, began resurfacing with terrible practicality. Mana had never vanished. It had thinned, atomized across billions of hungry lives until each of us carried only dust. The invasion solved the problem in the cruelest possible way.

Children learned sparks before letters. Nurses coaxed infection from wounds with hymns. Farmers in the ruins of Nebraska called rain by their family names. We mourned and trained in the same breath.

When the alien fleet descended again, expecting the efficient prey it had left behind, the sky met them differently. Mountains answered us. Oceans remembered ancient bargains. The dead of our species had purchased, without consent, the return of wonder.

We won, and it felt like blasphemy.`,
      "google/gemini-3.1-pro-preview": `The aliens did not understand that every species has a threshold.

Ours, apparently, was six hundred million.

Before the war I had worked on distributed systems. After the war I worked on soup. Then one afternoon, while trying to split three potatoes among eleven people, I absentmindedly wished the knife sharper.

It became light.

Not metaphorically. The blade thinned into a line of white fire and cut the potatoes, the table, and a perfect trench through the concrete floor. Nobody in the shelter ate for an hour because they were busy staring at me.

Soon other incidents followed. A boy swallowed smoke and breathed it back as ravens. A medic stitched wounds closed by humming in Sanskrit she did not know she knew. Our physicists called it impossible field coherence. The old storytellers called it mana per capita.

When the mothership returned to finish the harvest, we welcomed it with every myth we'd archived as folklore. Dragons, curses, weather pacts, impossible geometry.

The last transmission we intercepted from orbit was wonderfully technical:

HUMAN CIVILIZATION HAS BECOME NONLINEAR.

That was the nicest thing anyone had ever called magic.`,
    },
  },
  {
    permutation: 3,
    textByModel: {
      "openai/gpt-5.4": `On their first date, Hannah met a marine biologist with beautiful hands and a laugh that came late, like it had to be translated.

On their second, she met a history teacher with the same laugh.

On the third, a chef whose hands were different but whose habit of tilting his head when listening made her feel weirdly comforted.

Months passed. Men came and went. A photographer who hated olives. A civil engineer who quoted Neruda badly. A paramedic who looked at her across candlelight with such desperate hope it almost felt unfair.

They all failed in distinct, memorable ways.

Then, one rainy Tuesday, Hannah ducked into a laundromat and found all of them there in fragments. The chef's eyes in the face of a stranger. The teacher's freckle on a barista's wrist. The marine biologist's anxious smile reflected in a vending machine.

A man stood up from the folding table with no fixed face at all. It shifted as he crossed the room, shedding old versions of himself like cards.

“I kept thinking,” he said softly, “if I learned enough about you, I'd get it right.”

Hannah stared for a long moment, then laughed.

“You should have tried getting it wrong honestly,” she said, and handed him her umbrella.`,
      "anthropic/claude-opus-4.6": `By the seventh man, Hannah began to suspect that disappointment had a type.

Different names. Different jobs. Different colognes. Yet there was always some quiet familiarity in the way they reached for the check, or paused before answering, or looked at her as though the world had narrowed dangerously.

If she had been less kind, she might have dismissed it as pattern-seeking. If she had been less observant, she might never have noticed at all.

She noticed in the rain.

The stranger under the bookstore awning smiled, and she recognized three previous smiles nested imperfectly inside it. His face faltered. Shifted. Became someone else, then almost her favorite someone else, then neither.

“Oh,” she said.

He looked miserable. “I know how this sounds.”

“I've dated you,” Hannah replied.

“All of me, yes. Or rather, several attempts at me.” He folded his hands. “I thought if I changed enough, I'd eventually become the person you could love.”

The sadness of it was so earnest she wanted to scold him and hold him at once.

“You idiot,” she said gently. “You only had to be one person long enough for me to meet him.”`,
      "google/gemini-3.1-pro-preview": `The shapeshifter support group met every Thursday in a church basement and had exactly one rule: no reusing forms within city limits.

Miles broke it constantly.

He had been a violinist, a carpenter, a substitute teacher, and once, disastrously, a man with a motorcycle and opinions about Nietzsche. Every identity lasted two to five dates before collapsing under the weight of some tiny mistake. Hannah always said the same thing in different words: “You're nice, but something about this doesn't feel real.”

On Thursday he slumped into a folding chair while the vampire treasurer passed around stale biscuits.

“Same girl?” asked a dryad.

Miles nodded.

“Try honesty,” suggested the vampire.

“That has never worked for anyone,” Miles muttered.

But when he saw Hannah again at a gallery opening, tired and laughing and beautifully herself, he did exactly that. He let the borrowed face melt away.

She stared. “Have I met you?”

“In a sense,” he said.

A smile tugged at her mouth. “That would explain why all my exes apologized exactly the same way.”

It wasn't acceptance. Not yet.

But it was the first date he attended with only one face, and somehow that felt like progress.`,
    },
  },
  {
    permutation: 4,
    textByModel: {
      "openai/gpt-5.4": `My grandmother died at 11:43 p.m., just before the deepest dream.

The doctors called it peaceful. I was there, holding her hand in the hospital room nested inside the city apartment nested inside the childhood house nested inside whatever came before. Every night of our lives, we woke into another dream and named it morning. That was how humanity survived a one-day lifespan: by descending.

At midnight, the nurses dimmed. The room trembled. The long flashback began.

People always described it the same way: your life passes before your eyes. What they meant was that you rose—through sleepovers, apartments, first kisses, old kitchens, schoolyards, cribs—waking in each prior dream for a single vanishing moment before being pulled upward again.

Grandmother had warned me when I was little.

“Be kind to everyone you meet,” she said. “They're all sharing only one day with you.”

As she vanished backward through her lives, her eyes opened once more in the face of the young mother I remembered from my own fifth dream. She smiled at me with impossible recognition.

Then she was gone, all the way to the first cradle-dark.

I lay awake afterward, terrified and grateful. Morning, I understood, was merely another word for inheritance.`,
      "anthropic/claude-opus-4.6": `Human beings are mayflies with architecture.

That is how Professor Sen explained it in my first philosophy class, while most of us fought the instinctive terror of the thought. We live one true day only. To endure the brevity, the mind folds itself inward each night, creating a deeper dream in which another morning waits. Childhood, marriage, age—these are elegant descents.

I understood the theory. I did not understand the tenderness of it until my father died.

His breathing slowed in the little seaside cottage that had been his current life. Then came the strange clarity everyone speaks of. His gaze sharpened, not on me but through me, as if he were already waking elsewhere. He whispered my name, then his mother's, then the name of a dog dead twenty years in this layer and perhaps still barking in an upper one.

For one minute he was young again, startled by lamplight, then younger still, laughing in a college dorm, then a frightened boy in a thunderstorm.

We call it life flashing before the eyes. It felt more like love retrieving itself, room by room, until it reached the first small dream and went dark.`,
      "google/gemini-3.1-pro-preview": `By custom, you do not let a dying person fall asleep alone.

Not because they are afraid of death. Everyone knows what death is. It's the elevator rising through every dream you've called a life, stopping briefly at each floor while memory scrambles to keep up.

I sat beside Mara in the hospice garden while midnight approached. She was ninety-one in this dream, which meant she had slept deeply and well. “When it starts,” she told me, “talk. Your voice carries upward.”

So I did.

I narrated the life we'd shared: the bakery in Lisbon, the stupid yellow sofa, the summer she taught our grandson to lie convincingly about card tricks. Her eyes fluttered. Somewhere above us, another Mara was waking in some earlier room and hearing an echo of me.

Then she whispered, suddenly young, “You found me again.”

That was the part no textbook mentioned. Sometimes, across the stacked dreams of a single day, love leaves enough fingerprints to be recognized on the way out.

When she died, I did not feel abandoned.

I felt as though she had gone upstairs.`,
    },
  },
  {
    permutation: 5,
    textByModel: {
      "openai/gpt-5.4": `I ordered a black coffee in rural Kansas and told the cashier it was too hot.

He dropped the cup.

The woman behind me, who had been chatting in Spanish to her son, heard my complaint in Spanish. The trucker at table four heard it in Polish and kept eating. That part was normal. Since childhood, everyone heard my voice in whatever language lived deepest in them. I was a novelty at parties, useful in airports, mildly embarrassing on first dates.

The cashier heard something else.

His face drained white. “Say that again,” he whispered.

I did. He backed into the milk dispenser like I'd drawn a weapon.

“Nobody speaks that,” he said. “Nobody's spoken that in thousands of years.”

He locked the lobby, flipped the OPEN sign to CLOSED, and led me to the stockroom. From a tin under bags of sugar he pulled a stone tablet covered in marks I somehow knew were not writing but memory.

“According to my grandmother,” he said shakily, “when the Last Tongue returns, the buried city wakes.”

I touched the tablet and understood, without learning, that my next sentence would open a door under the parking lot.

I had only wanted coffee.`,
      "anthropic/claude-opus-4.6": `For most of my life, my gift made people smile.

Taxi drivers laughed when I answered them in the language of their childhood villages. Tourists cried. Grandmothers crossed themselves. At worst, a linguist would corner me at a dinner party and ask impossible questions about grammar I had never consciously learned.

Then I stopped at a highway McDonald's at dusk.

The young cashier greeted me with bored efficiency. I asked for fries and watched horror bloom across his features with such purity that I thought he was having a stroke.

“What did you say?” he whispered.

“Fries?”

He leaned over the counter. “No. In what tongue?”

I could only shrug. I never heard what I sounded like to others.

He took my hand and turned it palm-up with reverence that made the fluorescent kitchen seem briefly like a chapel. “My family kept a dead language,” he said. “Not on paper. In songs. We were told if we ever heard it spoken by a stranger, we were to follow them underground.”

Behind the ice machine, hidden by years of grease and routine, there was a stairwell. Some doors wait in ridiculous places.`,
      "google/gemini-3.1-pro-preview": `I knew something was wrong when the cashier vaulted the counter.

Not around it. Over it.

One second he was asking whether I wanted to supersize the meal; the next he was grabbing my shoulders, searching my face like I'd stepped out of a prophecy. Everyone else in the restaurant kept chewing because they had heard me speak in plain English, Vietnamese, Arabic, whatever belonged to them.

He had heard the dangerous version.

“My people died keeping that language buried,” he said. “Why are you speaking it in public?”

“Because I asked for nuggets?”

He did not laugh. He dragged me into the freezer, where a metal hatch waited behind stacked boxes of pies. Beneath it sprawled a ruin older than the town, lit by emergency strips and painted in symbols that prickled behind my eyes.

When I spoke again, every stone lamp flared awake.

The cashier closed his eyes. “Great,” he muttered. “The emperor came back in a food court.”`,
    },
  },
  {
    permutation: 0,
    textByModel: {
      "openai/gpt-5.4": `I was the best bouncer in Chicago because numbers never lied.

Every face that came to the velvet rope carried an invisible age floating above it. Nineteen. Forty-two. Seventy. Fake IDs bored me. Biology handled the paperwork.

Then, on a sleeting Thursday, a woman in a red coat stepped out of the line and smiled at me like we'd already met.

1047 hovered over her head.

I checked for tricks. Contacts. Projectors. Hallucination. The number held steady.

“Private event?” she asked.

I stepped aside automatically.

Inside, the club's bass thudded through walls old enough to remember warehouses and fire. The woman drifted to the bar, where three others were waiting. One wore a suit older than fashion. One had a braid threaded with coins. Over each of them glowed four digits.

They raised their glasses when they saw me noticing.

“Congratulations,” said the one in the suit. “Most mortals never spot us.”

“Spot what?”

“The city,” the red-coated woman said gently. “Or rather, the people who keep it from noticing how many times it has already died.”

That was how I learned my gift wasn't for guarding nightclubs.

It was for checking immortals at the door.`,
      "anthropic/claude-opus-4.6": `The number above her head was older than cathedrals.

For ten years my talent had been useful, if mundane. Underage drunks hated me. Police loved me. Friends asked intrusive favors at weddings. I had come to think of the floating ages as merely an oddity stitched into ordinary life.

Then she arrived in winter silk with 1047 shining over her hair like a private halo.

She noticed my stare and inclined her head, not offended but resigned. As if secrecy had an expiration date and mine had just elapsed.

“You can see it,” she said.

I nodded.

Around us, the line to the club surged and complained, oblivious. Snow gathered in the gutter. Music leaked from beneath the door in pulses. She stepped closer, and for one insane moment I smelled salt, smoke, and old plague pits.

“There are others in there,” she said softly. “We meet once a century in whatever city has survived itself most artfully.”

I almost laughed from fear.

“Why tell me?”

“Because after a thousand years,” she said, “you begin to value the rare person who can verify you still exist.”`,
      "google/gemini-3.1-pro-preview": `I had exactly twelve seconds to decide whether to let the thousand-year-old woman into the club.

The line behind her was restless, the DJ upstairs already texting about capacity, and floating over her perfectly winged eyeliner was the number 1047.

“ID?” I asked, because panic makes bureaucrats of us all.

She handed over a laminated state license that said she was thirty-two. “Technically true several times,” she said.

I waved my scanner over it for something to do with my hands. Green light.

Then three more people approached, each with four-digit ages and the body language of coworkers arriving to the same quarterly nightmare. One muttered in Akkadian. Another rolled his eyes in Mandarin older than the city.

“You host this here every century?” I asked.

“Different venues,” said the woman. “Same agenda. Pestilence, war, urban planning.”

She leaned closer. “You're invited, by the way. Anyone who can audit immortals is too valuable to leave standing outside.”

I looked at the rope, the fake tans, the spilled vodka, and the secret parliament of the deathless waiting for my answer.

Then I unclipped the velvet.

“Cover charge doubles after midnight,” I said.`,
    },
  },
  {
    permutation: 1,
    textByModel: {
      "openai/gpt-5.4": `Barack Obama found the letter before dawn, sitting on the nightstand where no Secret Service detail should have allowed it to be.

No return address. Heavy cream paper. Good penmanship.

I hope you've had a chance to relax Barack...but pack your bags and call the number below. It's time to start the real job.

Signed simply, JFK.

He stared at it long enough to decide he was either being recruited into a prank or the oldest conspiracy in America. The number connected on the first ring.

“Blue rider,” said a woman's voice.

He glanced back at Michelle, still asleep. “I think I may have the wrong—”

“No, Mr. President. You have exactly the right one. Wheels up in forty minutes.”

By noon he was in a hangar beneath a New Mexico mesa, standing with Carter, Grant, and a very much alive John F. Kennedy in front of a steel blast door marked CONTINUITY OFFICE.

“Every president gets one peaceful term after office,” JFK said, extending a hand. “Then we tell them the republic is bigger underground.”

Behind the door maps covered threats no voter had ever heard of.

Barack read the briefing title and laughed despite himself.

POST-PRESIDENTIAL DUTIES: APOCALYPSE PREVENTION.`,
      "anthropic/claude-opus-4.6": `Retirement had taught him the rare pleasure of mornings without briefing folders.

So the envelope on the bedside table felt, immediately, like a violation of physics and peace alike. He read it twice in the blue pre-dawn hush while the house around him remained still.

Signed simply, JFK.

The sensible response would have been to notify security. The presidential response—old instincts never quite retiring—was to call the number first.

A woman answered as though expecting him. “Good morning, sir. Bag packed?”

By afternoon he stood beneath the Lincoln Memorial in a chamber tourists passed above without suspecting. There, in lamplit calm, sat the unofficial fraternity of former presidents: the weary, the decent, the compromised, the impossible. Kennedy among them, older than he should have been and carrying his own ghost lightly.

“We preserve continuity,” JFK said. “Not of government. Of the species.”

The files on the long oak table spoke of asteroids nudged quietly away, cults defused, wars prevented by conversations history never recorded.

Obama exhaled, halfway between laughter and prayer. Democracy, he realized, had an aftershift.`,
      "google/gemini-3.1-pro-preview": `The number in the letter routed through six countries before landing in a diner outside Dallas.

“Booth three,” said the waitress when Barack walked in.

Booth three held John F. Kennedy, annoyingly handsome for a dead man.

“I know,” JFK said, before Barack could speak. “Whole thing's rude.” He slid a menu across the table. Written where the specials should have been was a list of code names, orbital tracks, and the phrase WELCOME TO SECOND TERM.

It turned out every former president who could still keep a secret got recruited into a parallel service once the cameras left. Eisenhower handled extraterrestrial diplomacy. Carter specialized in post-disaster elections. Teddy Roosevelt, according to the file, had been benched for excessive enthusiasm.

“And me?” Barack asked.

JFK smiled. “You read briefings, you keep your head, and people underestimate how dangerous hope is when administered professionally.”

Outside, the waitress flipped the OPEN sign to CLOSED.

Inside, Kennedy opened a case file stamped with a familiar silhouette.

SUBJECT: UNITED STATES OF AMERICA.
STATUS: ONGOING.`,
    },
  },
  {
    permutation: 2,
    textByModel: {
      "openai/gpt-5.4": `My great-great-great-great-grandfather paid $39.99 in 2017 to “buy” a star from a novelty website.

For centuries, the family treated the certificate like a joke. It survived three house fires, two divorces, and one unfortunate attempt to use it as a placemat. Then the Khell Arbitration Fleet arrived in orbit and requested to speak with the legal owner of the Tannhäuser Minor Crown Dependencies.

That was, somehow, me.

The lawyers explained it with the grave delight of people witnessing a loophole become theology. In 2289, interstellar treaty law had adopted pre-contact terrestrial ownership claims as provisional placeholders where no stronger claim existed. The website's terms and conditions, ridiculous in origin, were airtight in language.

“Your ancestor purchased naming rights,” the ambassador protested.

“Yes,” my solicitor replied. “And then, through a chain of modern legal shenanigans too boring to summarize, those rights matured into hereditary stewardship.”

So I inherited three moons, a customs corridor, and an empire of six million confused aliens who expected decisive leadership.

I did what any responsible sovereign would do.

I called my grandmother, dug the certificate out of the attic, and framed it above the throne.`,
      "anthropic/claude-opus-4.6": `Families preserve absurdities better than treasures.

In ours it was the certificate—cheap parchment, embossed seal, one ridiculous line assigning ownership of a star to my impossible ancestor Leonard H. Pike, who in 2017 apparently had too much internet access and too little restraint. The document was produced every holiday to embarrass the branch of the family most given to ambition.

Then the sky sent lawyers.

They arrived in a vessel delicate as cut glass and presented, with impeccable courtesy, a dispute over tariffs in the Pike System. When I laughed, they did not.

It took six sleepless days, a team of human contract historians, and one jubilant Martian notary to establish the truth: due to overlapping treaty recognitions and a cascade of colonial bankruptcies, Leonard's novelty purchase had become the oldest uncontested title in a very small intergalactic empire.

The ambassadors awaited commands. Ministers bowed. A census larger than Earth hung on the display wall.

I looked at the faded certificate in its dollar-store frame and thought of Leonard clicking BUY NOW because he found the idea funny.

Dynasties, I learned, are often founded by prank purchases history forgets to correct.`,
      "google/gemini-3.1-pro-preview": `The empire came with an onboarding packet.

That was the first insulting part.

The second insulting part was that the packet was addressed to ME, in all caps, because some idiot ancestor had clicked a “buy a star” ad in 2017 and, through layers of jurisprudence no sane civilization should respect, accidentally established a permanent line of succession.

By the time I finished reading, I understood three things: one, the star certificate was legally binding under six interstellar regimes; two, my family line owned a trade nexus the size of Belgium; and three, the previous regent had abdicated specifically because he didn't want to argue with tax law written by humans.

The coronation happened on Tuesday. I wore my grandfather's suit because nobody had told me emperors needed special clothes. Millions watched as a jellyfish bishop asked whether I would defend the customs lanes, uphold the orbital charters, and honor the Sacred Addendum attached in 2017.

I asked what the addendum said.

The bishop read solemnly: “No refunds.”

I said yes.`,
    },
  },
  {
    permutation: 3,
    textByModel: {
      "openai/gpt-5.4": `“Crikey,” Steve Irwin said, beaming at the eight-foot wraith trying to climb his back, “look at the length on this beauty.”

The afterlife audience loved him because he treated horror like ecology. Banshees, bog hounds, attic saints with too many elbows—none of them were monsters on his program. They were simply misunderstood little rippers with territorial instincts and a bad reputation.

Tonight's taping took place in the Bleak Fen, home of the notoriously irritable barrow crocodile. Three camera shades drifted behind him while souls in the celestial amphitheater roared approval.

“Now, the trick,” Steve whispered, crouching in spectral mud, “is respecting the old girl before you get your hand near the fangs.”

The barrow croc erupted from the black water with the scream of a cathedral hinge. Steve laughed, caught it around the neck, and rolled with it so expertly the ghost cameras barely shook.

“See that?” he cried. “She's not evil. She's frightened!”

Millions cheered. Somewhere in the front row, Death itself leaned forward like a child watching a favorite zookeeper.

No soul left Steve's show more afraid of the dark.

That was why it stayed number one.`,
      "anthropic/claude-opus-4.6": `In life he had shown people that fear was often just wonder without context.

In death he kept the same job.

The studio floated at the edge of the afterworld where swamps of memory met forests of unfinished prayers. Each week Steve Irwin strode into some impossible biome in khaki that never stained and addressed the dead like beloved students. “What we've got here,” he'd say, “is a magnificent old creature who's had a rough go of legend.”

Then he would introduce a hellhound, or clasp the antlers of a thunder stag, or gently disentangle a widow spirit from the church bells she haunted.

Tonight it was a corridor poltergeist, all jangling keys and broken portraits. Steve approached with the same delighted respect he once reserved for crocodiles.

“Easy, mate,” he murmured. “No need to carry all that anger in your shoulders.”

The thing quieted. Camera wisps hovered nearer. Across paradise, millions watched and felt some old terror inside them loosen.

That was the miracle of the show: not conquest, not spectacle, but translation. Steve made the supernatural seem part of the same living family as every dangerous, dazzling animal we had ever misnamed a beast.`,
      "google/gemini-3.1-pro-preview": `The producers wanted ratings. Steve wanted conservation.

Those goals aligned more often than you'd think in the afterlife.

“Right,” he said, tugging on his spectral khaki sleeves while the makeup cherubs fussed around him, “what've we got this week?”

“Category Four revenant,” said the assistant. “Eats fear, hates bells, currently nesting in the old abbey set.”

Steve's grin widened. “Gorgeous.”

The live audience cheered as he stepped into moonlit ruins. The revenant exploded from the bell tower like a coat made of night and teeth. Any other host would have fled. Steve tilted his head, delighted. “Look at the markings! Absolutely stunning!”

He let it circle him twice, murmuring all the while, then produced a bundle of blessed reeds and a cracked handbell wrapped in cloth. “We're not here to upset you, mate. Just relocating you someplace with proper marshland.”

Ten minutes later the revenant was dozing peacefully in a sanctuary bog and the audience was in tears.

For the tenth year running, the hottest show in the afterlife ended the same way: with Steve whispering, “Isn't she lovely?” to something everyone else had called a nightmare.`,
    },
  },
  {
    permutation: 4,
    textByModel: {
      "openai/gpt-5.4": `The banners on the harbor read WELCOME BACK, AMERICA in fourteen languages, none of them English first.

After fifty years of mandated isolation, we had expected ruins abroad. Maybe rival bunkers. Maybe smoke.

Instead, when our delegation sailed into what used to be Lisbon Bay, we found floating gardens, quiet orbital elevators on the horizon, and a customs line moving with insulting efficiency. Children pointed at us the way children point at reenactors.

The Portuguese minister greeted us politely and accepted our statement of reentry without even pretending surprise.

“You mean you all really did it?” she asked.

“Did what?” our secretary of state said.

“Stayed isolated.”

A silence fell so complete I heard gulls.

It emerged over the next six hours that the postwar treaty had been signed by everyone, celebrated by everyone, and then quietly ignored by everyone except the United States, which had treated it with the grim literalness usually reserved for tax code and curses. The world had spent fifty years trading, rebuilding, hybridizing, and occasionally sending us aid packages returned unopened.

That evening I stood on the dock watching solar ships move through a civilization that had gone on without us.

For the first time in my life, American exceptionalism felt less like pride and more like a punchline delivered gently by history.`,
      "anthropic/claude-opus-4.6": `We came out of exile carrying our myths with us.

They had sustained us for fifty years: that the world beyond our cordon was equally shuttered, equally austere, equally suspended in grief. We imagined synchronized loneliness on a planetary scale. It made obedience bearable.

Then the fog lifted from the Atlantic and the coast of Morocco appeared threaded with wind towers, bright rail lines, and markets large enough to be seen from orbit.

No one had been waiting in silence.

At the first diplomatic reception, an elderly Kenyan ambassador laughed so softly it almost qualified as pity. “We assumed your Congress would come to its senses in a year or two,” she said. “When it did not, we kept mailing invitations.”

They showed us archives of festivals, treaties, scientific unions, marriages across borders we had treated as sealed wounds. Humanity had not spent half a century brooding. It had healed in company.

That night our delegation stood on a hotel balcony and watched a city speak ten languages at once beneath us. I understood then that isolation had not protected us from another war.

It had merely deprived us of everyone else's peace.`,
      "google/gemini-3.1-pro-preview": `The first clue should have been the souvenir shop.

If the rest of the world had been in hard isolation for fifty years, there should not have been a cheerful kiosk in Reykjavik Airport selling “I ❤️ THE REUNION” mugs in six currencies. But our delegation was too busy rehearsing solemn speeches about shared sacrifice to notice.

Then we stepped outside.

The city was dazzling, dense with architecture we didn't recognize and fashions that had clearly evolved without consulting us. Teenagers flew commuter drones past murals depicting international space crews we'd never heard of. A busker played jazz in Mandarin and Yoruba. Nobody looked particularly traumatized.

At the summit, the Secretary-General took one look at our prepared remarks and winced. “Oh,” she said. “You people really stayed home.”

Apparently everyone else had signed the isolation pact, held one symbolic week of closure, then resumed cooperation by unanimous unofficial agreement. They'd assumed we'd done the same.

We hadn't.

In one afternoon, the United States went from triumphant survivor-state to the world's most elaborate misunderstanding.`,
    },
  },
  {
    permutation: 5,
    textByModel: {
      "openai/gpt-5.4": `When the bee landed on my shoulder, every person on the veranda stopped breathing.

My mother dropped the lemonade pitcher. Colonel Hayes reached for the rolled newspaper he kept for exactly this nightmare. The gardener made a sound like prayer breaking.

All my life I'd been told the same story: a single sting would kill me. Stay away from hives. Keep windows screened. Trust the fear others carry for you.

The bee rubbed its front legs together, looked directly at me, and bowed.

“Your Majesty,” it said in a tiny, clear voice, “what are your orders?”

The newspaper rolled from Hayes's hand.

A second bee landed on the railing. Then ten more. Then a gold-cloaked cluster rose from the roses like embers taking shape. I felt something in my chest answer them—not pain, not allergy, but recognition.

My mother went very pale.

I turned to her. “What did you do?”

Her eyes filled instantly. “I was told your father died in the hive wars,” she whispered. “I thought if you never knew, they would never come for you.”

The first bee bowed again, patient as protocol.

Beyond the garden wall, the flowers were beginning to move like an army arriving home.`,
      "anthropic/claude-opus-4.6": `They had wrapped my life in caution so thoroughly that fear felt hereditary.

No picnics in spring. No open car windows. No wildflowers in the house. At seven I learned the word anaphylaxis before I learned allegiance. At eighteen I knew three bodyguards by heartbeat and still had never stood in a meadow.

So when the bee settled on my shoulder in the afternoon sun, everyone around me became a statue of dread.

It was smaller than I expected. Delicate. Its feet hardly weighed anything.

“Your Majesty,” it said, voice fine as violin wire, “what are your orders?”

The world did not shatter. It deepened.

I heard, all at once, a low golden murmur coming from every blossom on the estate. Not noise—language. A thousand patient reports. Petal yields. Border activity. Rumors from the lavender fields.

My mother sank into a chair. There was a history in her face I had not been permitted to read before.

“I'm sorry,” she whispered. “I thought hiding the crown would keep you human.”

The bee inclined its head. “The crown has never asked that Your Majesty be anything less.”

For the first time in my life, I stepped barefoot into the garden and was not afraid.`,
      "google/gemini-3.1-pro-preview": `I was twenty-four years old before anyone failed to swat a bee fast enough.

It happened at a garden fundraiser, which made the whole thing feel especially insulting. One moment I was accepting a donation check, the next there was a strip of gold on my shoulder and four grown men diving for epinephrine.

“Stop,” said the bee.

Nobody stopped. The bee sighed with regal disappointment and shouted, far louder than anything that size should manage, “KNEEL FOR YOUR QUEEN.”

The roses erupted.

Bees poured from hedges, gutters, champagne buckets, and the decorative topiary bulldog near the gate. They swarmed into ranks so precise it was impossible not to recognize ceremony. My head of security dropped to one knee first. My mother followed more slowly.

“Right,” I said weakly. “I have questions.”

“As do we,” said the herald bee. “The western apiaries request tax relief. The hornets are massing. And the throne has been empty for twenty-six years.”

I looked at my mother. She covered her face.

Turns out the allergy story had been less medical diagnosis, more witness protection.`,
    },
  },
  {
    permutation: 0,
    textByModel: {
      "openai/gpt-5.4": `At 8:14 a.m., every #1 Dad mug on Earth changed.

Mine became #18,243,771.

I stared at it over coffee, blinked twice, and then checked the bottom for a joke logo. Nothing. The glossy blue lettering had simply reformed itself while the kettle was boiling. Outside, a man in the apartment courtyard was shouting that he'd dropped from #7 to #4,902 after forgetting soccer practice.

By noon, there were talk shows, riots in novelty stores, and an underground market for counterfeit rankings. By dinner, my daughter Lucy came home from school carrying her lunch thermos like evidence.

“Olivia's dad is number twelve,” she announced.

“Good for Olivia's dad,” I said, trying not to sound wounded.

Lucy set down her backpack. “Why are you eighteen million?”

There are questions children ask cruelly by accident and questions they ask because truth is finally available. This was the second kind.

So I told her I missed recitals. I answered emails at the park. I sometimes treated providing as if it excused absence.

The next morning my mug read #18,243,745.

Not much better.

But Lucy saw me leave work early that day, and the next, and the day after that.

By spring, I had crossed into seven digits.

I've never wanted a stupid mug more.`,
      "anthropic/claude-opus-4.6": `Society had not been prepared for objective fatherhood.

The change happened at breakfast. Across the world, ceramic declarations of paternal supremacy quietly corrected themselves. Kitchens filled with gasps. Garages with profanity. Offices with men hiding mugs in desk drawers as if shame were contagious.

My husband stood frozen before his coffee, staring at the new inscription on the gift our son had given him in second grade.

#642.

“That's… unexpectedly good,” I said.

He did not smile. “Who outranked me?”

By lunch, the rankings had become a national obsession. But the truly interesting changes were not in headlines. They were in behavior. Men called daughters back from parking lots. Learned teacher names. Asked about nightmares instead of merely paying for orthodontics.

At supper our son examined the mug and said, with devastating seriousness, “If you get better at listening, do you think you'll crack the top five hundred?”

My husband laughed then, soft and humbled. “I hope so.”

The next week it read #611.

Turns out love had always been measurable. What changed overnight was only that some people finally believed the score mattered.`,
      "google/gemini-3.1-pro-preview": `The first casualty was brunch.

Every father's day buffet in the country dissolved into statistical crisis as mugs updated in real time. A man who had coasted for twelve years on barbecue and dad jokes dropped from #43 to #901 after forgetting sunscreen. Another achieved #1 for exactly eight minutes in rural Manitoba before apparently yelling at a Little League umpire and sliding to #6.

My brother, who had always treated parenting like a friendly improv challenge, looked down at his mug and groaned.

#2,114,008.

“That's not even elite mediocrity,” he said.

His eight-year-old daughter peered over the table. “Can I help you train?”

So she did. She built him a regimen: one full conversation without checking his phone, three school pickups on time, two apologies issued without excuses, and mandatory attendance at all living-room performances involving cardboard props.

The rankings turned out to be dynamic, ruthless, and strangely generous. Improvement mattered.

Three months later, my brother kicked open my door holding the mug above his head like a trophy.

#87,441.

Still not number one. But, for the first time, genuinely trying.`,
    },
  },
  {
    permutation: 1,
    textByModel: {
      "openai/gpt-5.4": `The archive box was mislabeled CHRISTMAS DECORATIONS.

Inside were clippings about buildings I didn't remember burning and men I didn't remember throwing through them. Grainy photos showed a masked figure above smoking skylines, hands lit with white fire. Under every headline was the same name.

BLACK EVENT.

According to the articles, I had once held three coastlines hostage, rewritten gravity over Boston Harbor, and demanded the moon be lowered by “a more respectful amount.” The super hero Meridian had defeated me without killing me by erasing every memory connected to my existence—mine included. Mine especially.

I laughed when I reached that part. Then I found the apology letter in my own handwriting.

If you are reading this, it means the seal failed. I asked Meridian to do this. I was running out of reasons not to end the world.

My knees gave out beneath me.

At the bottom of the box sat one final object: a newspaper from last week. On page three, a small crime report described a man levitating armored cars over the interstate.

The article included a familiar phrase: witnesses reported a white glow around the hands.

I had been the most powerful supervillain in history.

And someone, somewhere, had remembered enough to start again.`,
      "anthropic/claude-opus-4.6": `The articles read like slander until I reached the photographs.

There is a way one recognizes oneself even through masks, even through old newspaper grain and impossible context. In every image the villain stood with my stance, my stubborn shoulders, the same small scar near the chin. Cities burned around him like punctuation.

Once the world had called me Ruin.

The hero who stopped me had a different philosophy from the others. Instead of prisons or executions, Meridian erased. Villains were removed not only from public memory but from the minds of everyone who had loved, feared, served, or fought them. Reintroduced to society as blank lives. Harmless, ideally.

At the very bottom of the box lay a cassette tape. On it, in careful handwriting, were three words.

FOR WHEN READY.

I played it.

My own voice filled the room, exhausted and lucid. “If you've found this, the barrier is thinning. I asked for this cure. I was tired of being worshipped by my worst impulse. If Meridian is dead, or if someone is trying to restore me, remember one thing: power felt cleanest right before it became cruelty.”

Then, after a pause: “Please choose differently than I did.”`,
      "google/gemini-3.1-pro-preview": `The weirdest part of learning you were once the world's most powerful supervillain is how bureaucratic the evidence looks.

Insurance reports. Court transcripts. Property claims. An invoice from the city of Chicago for one collapsed bridge and “associated atmospheric anomalies.” No capes in the box. No glowing crystals. Just paperwork proving I had ruined half a decade of civilization and then vanished from memory like a software patch.

I was still processing item seventeen—an editorial titled CAN MERIDIAN ERASE EVIL OR ONLY DELAY IT?—when someone knocked on my apartment door.

A woman in a raincoat stood there holding a grocery bag and a tired expression. “You found the box,” she said.

“Who are you?”

“Retired,” she replied. Then, after a beat: “I was Meridian.”

She came inside, looked around my cheap furniture, and seemed relieved. “You asked me to wipe you. Said prison would only turn you into a martyr. You wanted ordinary consequences instead.”

“Did it work?”

She studied me carefully. “Mostly. But someone out there has started remembering your old symbol.”

From the grocery bag she produced my old mask.

“I'm here,” she said, “to find out whether I'm stopping a villain or recruiting a partner.”`,
    },
  },
  {
    permutation: 2,
    textByModel: {
      "openai/gpt-5.4": `The dagger did not kill.

It translated.

That was the doctrine I repeated to myself each time I pressed the blade to another doomed throat in the refugee camps of the final years. On this Earth, the oceans were dying and the sky was becoming glass. On the other Earth—the untouched one, the one the mystics had shown me in blood and impossible geometry—everyone struck by the knife opened their eyes alive again beneath a safer sun.

Here, they called me butcher. There, they built statues.

I knew both reputations were true.

The hardest part was children old enough to understand. The easiest part was old men who had seen enough and held their chins steady for me.

Near the end, as governments collapsed and lines stretched for miles, a woman in handcuffs spat at my boots and called me monster.

On the untouched Earth, according to the return notes hidden inside the dagger's hilt, that same woman organized hospitals and named one ward after me.

Hero. Killer. Ferryman.

Language failed at the edge between worlds. I kept going anyway, because extinction was a cruelty with no resurrection clause.`,
      "anthropic/claude-opus-4.6": `History split me into two biographies and neither one was merciful.

On the dying Earth I was tried in absentia under every legal system still functioning. The charges were mathematically impossible to summarize. Mothers hid children when my convoy passed. Priests denounced me by name. My face became shorthand for industrial murder.

On the surviving Earth, the one reached only through the dagger's wound, schools taught the Procession of Mercy. Murals showed a hooded rescuer delivering billions from a doomed sphere into second birth. They lit candles for me there.

The truth lived in the space between those worlds, in the moment before each strike. You looked a person in the eye and asked them to trust an atrocity because the alternative was extinction. Some said yes. Some cursed me. Some begged to go first. Some refused until fire touched the horizon and then changed their minds with tears.

Every night I dreamed of the two afterlives waiting for me: saint and monster. I deserved both, perhaps. But when Earth finally began to die in earnest, the lines still formed. People kept coming to the knife.

Hope, I learned, can wear the face of horror and remain hope nonetheless.`,
      "google/gemini-3.1-pro-preview": `By the fifth million, I stopped reading the headlines.

THE KNIFE OF THE DEVIL.
THE SAVIOR SLAUGHTERS ANOTHER CITY.
HERETIC OR HERO?

None of it helped at triage.

What helped was the notebook returned through the dagger each dawn. Names of those I'd sent the day before, followed by impossible updates from the alternate Earth where they woke. Alive. Fed. Angry, usually. Then grateful. Then busy rebuilding.

Some entries were annoyingly specific.

Marta Velasquez: punched first doctor she saw. Now apologetic. Requests coffee.
Imran Sayeed: started refugee choir. Asks if you can send more tenors.

The notebook was the only thing that kept me moving when the current Earth called me serial killer and the other tried to turn me into a religion.

I was neither. I was logistics with blood on it.

The last person I ever sent through was my own reflection in a shattered metro window. The sky behind me had begun to peel open. I raised the dagger, whispering the same prayer I'd said for years.

May the better world forgive the cost of reaching it.`,
    },
  },
  {
    permutation: 3,
    textByModel: {
      "openai/gpt-5.4": `The rescue package launched six minutes after the aliens posted the ransom note.

To be fair, it wasn't technically a ransom note. It was more of an interstellar courtesy notice explaining that Subject: MATT DAMON had been acquired for cultural study and would be returned after “noninvasive entertainment extraction.”

What the abductors did not know was that humanity had developed a very specific reflex around Matt Damon going missing.

NASA mobilized before the White House could issue a statement. The European Space Agency offered propulsion support. A private billionaire pledged three rockets, a moon tug, and what he called “the Damon Clause.” Social media unified in the strangest display of global solidarity since the asteroid scare.

On the alien vessel, Damon sat politely in a specimen chair while technicians screened The Martian, Interstellar, Saving Private Ryan, and three Bourne films in growing alarm.

“Why,” asked the lead xenobiologist, “do they always come back for you?”

Matt thought about Mars, war zones, amnesia, and the absurd consistency of public affection.

“Honestly?” he said. “At this point I think it's tradition.”

Three hours later, the first human boarding craft punched through the docking ring carrying a patch that read GET IN, LOSER, WE'RE SAVING MATT DAMON AGAIN.`,
      "anthropic/claude-opus-4.6": `The aliens chose badly, but not maliciously.

They had scanned humanity's transmissions for an individual of apparent recurring strategic importance. The pattern was compelling: whenever this Matt Damon person vanished, vast resources mobilized. Governments coordinated. Engineers performed miracles. Audiences mourned and demanded retrieval. Naturally, they concluded he must be a planetary keystone.

So they took him.

Matt, to his credit, adapted with professional courtesy. He answered questions about film, Earth cuisine, and whether all rescue operations on his world involved this much orchestra. Through the observation window he watched the abductors grow steadily less comfortable as incoming signals multiplied.

The first transmission from Earth was diplomatic. The second was legal. The third was a crowdfunding campaign that reached eight figures in fourteen minutes. By the eighth, multiple space agencies had announced a joint recovery mission under a name no alien translator could parse: Operation How Many Times Do We Have To Teach You This Lesson.

Matt folded his hands and offered the nearest scientist an apologetic smile. “You really should've kidnapped an accountant,” he said.

Far below, Earth lit up with the old, ridiculous, sincere determination reserved for bringing him home.`,
      "google/gemini-3.1-pro-preview": `The abductors' mistake wasn't taking Matt Damon.

It was doing the background research afterward.

Once aboard the ship, they ran his name through human media and discovered a catastrophic pattern: stranded on Mars, recovered; lost in space, recovered; behind enemy lines, recovered; missing in action for narrative reasons, aggressively recovered. To the alien analysts, the conclusion was obvious. This man was either royalty or a recurring test of species commitment.

“Can we still put him back?” asked the junior officer.

“Not before the cultural interview,” said the commander.

Too late. Earth had already noticed.

Within an hour, Damon was being escorted past panic-stricken crew while every screen on the ship filled with emergency launches, public petitions, and one particularly enthusiastic military memo titled AGAIN.

Matt squinted at the footage. “Wow,” he said. “They got organized faster this time.”

The commander turned all four eyestalks toward him. “This time?”

Matt gave a sheepish shrug. “It's a whole thing.”

When the first boarding party cut through the hull, half the crew had already packed apology gifts.`,
    },
  },
  {
    permutation: 4,
    textByModel: {
      "openai/gpt-5.4": `The immortals looked twenty-three and tired in ways their skin could not show.

By the time science discovered the side effects, I was eighty-five, arthritic, and one of the so-called Lost Generations denied the treatment for being “too neurologically settled.” We had resented that for decades. Then the frozen citizens began arriving at my clinic.

They did not wrinkle. They did not weaken. They simply stopped making room.

Memories accumulated without weathering. Grief stayed sharp forever. Old embarrassments never dulled. Love did not deepen so much as calcify. The immortals came to us immaculate and overcrowded, carrying centuries of unsoftened self.

“It's all still happening,” one woman whispered while I checked pupils bright as a girl's. “My first breakup. My mother's funeral. Every election. I can feel them all at once.”

The government called it retention saturation. The newspapers called it the youth rot.

I called it proof that mortality had never been the body's flaw. It was the mind's mercy.

At eighty-five, watching the eternally young beg for the gentleness of forgetting, I felt something close to vindication and then hated myself for it.

The living, after all, do not become wise by outlasting time.

We become wise because time is allowed to pass through us.`,
      "anthropic/claude-opus-4.6": `When the treatment was announced, we mourned like a generation sentenced in public.

Those under twenty-six would remain forever young. Those of us older were deemed too risky, too formed, too expensive to preserve. We called ourselves the Lost Generations and learned how to envy beautifully.

Six decades later, the envy ended in hospital wards.

The ageless arrived with perfect faces and collapsing interiors. Their bodies held at twenty-five while their minds bore the full sediment of eighty, ninety, a hundred years. Nothing faded. Every humiliation remained first-fresh. Every sorrow bled in the present tense. Therapists described patients trapped in simultaneity, unable to let memory become memory.

At eighty-five, I sat across from a woman who looked younger than my granddaughter and listened as she described carrying seventy years of unshed grief like glass in her bloodstream.

“We thought immortality meant more life,” she said.

Outside the window, autumn leaves browned and let go with enviable grace.

“No,” I told her gently. “It meant less ending.”

And without ending, it turns out, the human spirit does not expand. It clots.`,
      "google/gemini-3.1-pro-preview": `The side effect was not cancer, or mutation, or some spectacular body horror the tabloids could illustrate.

It was backlog.

At eighty-five I volunteered at a Memory Relief Center because being excluded from immortality had left me with a nasty curiosity about how the lucky were doing. The answer: poorly. They arrived with faces unlined by time and minds jammed solid with unresolved decades.

A man who looked twenty-two flinched whenever a printer jammed because he'd once spent seventeen immortal years in a submarine. A woman with a gymnast's body could not sleep because every lullaby she'd ever heard played simultaneously in her head. Young forever, yes. Also crowded forever.

The scientists gave it a name—cumulative emotional persistence syndrome—which sounded expensive and helpless. My generation gave it a simpler one.

Too much yesterdays.

When reporters asked whether we felt vindicated, most of us lied politely. The truth was uglier and kinder at once: we pitied them. Mortality, it turned out, wasn't the thief. It was the editor.`,
    },
  },
  {
    permutation: 5,
    textByModel: {
      "openai/gpt-5.4": `My wife bought the welcome mat in 1998 because it was cheerful and we had just moved into a house with a real porch.

WELCOME, it said in friendly script with a little sun in the corner.

Twenty years later, after her funeral, I came home late and found a man standing in my hallway with his hat in both hands, pale and painfully polite.

“I hope you don't mind,” he said. “I did have permission.”

I looked from him to the open front door to the mat lying smugly on the step.

“You're a vampire,” I said.

“Technically, yes.”

He glanced at the mat like a lawyer checking a clause. “The welcome mats were our idea. Mid-century branding initiative. People adore them.”

I should have been terrified. Instead I was furious on behalf of every grandmother in suburbia.

He had come, it turned out, not to feed but to deliver condolences from my wife, who had known exactly what our mat really meant and had spent years quietly running the neighborhood's anti-vampire watch through the garden club.

On the back of the condolence card she had written one final note for me:

Burn the mat, Harold. Then invite only the ones with manners.

I did exactly that.`,
      "anthropic/claude-opus-4.6": `The mat had been a wedding gift.

Yellowed now at the edges, threadbare in the center, still bright with that uncomplicated word: WELCOME. My husband and I had stepped across it through births, arguments, package deliveries, and one memorable raccoon incident. I never considered it magical. Merely domestic.

Then the woman from two houses down arrived after sunset, carrying a casserole and no reflection.

She paused politely at the threshold. “May I?”

I looked at the mat. Looked at her. Her expression was all weary honesty.

“It's a loophole,” she admitted. “Our guild invented them in the thirties. Americans wanted hospitality. We wanted entry. It was an elegant compromise.”

I should have slammed the door. Instead I laughed—part shock, part grief, part the absurd timing of learning supernatural contract law while wearing socks with teacups on them.

She handed me the casserole. “For what it's worth, your husband always suspected. That's why he had the old rosemary planted under the windows.”

After she left, I turned the mat over. On the underside, stitched in tiny formal cursive, were the words TERMS AND CONDITIONS APPLY.`,
      "google/gemini-3.1-pro-preview": `The Homeowners Association meeting got ugly once we discovered the welcome mats.

At first it was just Mrs. Delgado from number fourteen insisting her late-night visitor had definitely turned into mist after borrowing a cup of sugar. Then old Mr. Pritchard produced an 1896 newspaper clipping about “hospitality rugs” marketed heavily in Eastern Europe by a company nobody could trace.

By the time the local vampire representative arrived—yes, apparently there was one—we had thirty-seven mats piled in the cul-de-sac and three priests arguing with a consumer-rights lawyer.

The representative, to his credit, looked embarrassed. “It was a legacy marketing campaign,” he said. “Very successful. Frankly unethical.”

“Can you enter without one?” I asked.

“Not unless invited.”

All eyes dropped to the mountain of cheerful doormats that had spent decades shouting exactly that in decorative fonts.

The HOA voted unanimously to replace them with stern coir rectangles reading NO SOLICITING, NO BLOOD, APPOINTMENTS ONLY.

Property values, oddly enough, improved.`,
    },
  },
  {
    permutation: 0,
    textByModel: {
      "openai/gpt-5.4": `We found Atlas behind a gas station when I was nine. Muddy, half-starved, clever enough to unlatch the gate by noon. He was a German shepherd with one torn ear and the solemn patience of a soldier waiting out leave.

Only later did I understand why he never feared thunder, why he barked at empty corners of the house, why he once disappeared for three days and came back smelling of salt, ozone, and roses that do not grow in our county.

After he died, I dreamed him properly for the first time.

He was standing on the deck of a ship made of starlight, paws planted wide as it cut through a black sea between worlds. Around him huddled children, old men, women in uniforms from wars I couldn't name, all of them lost until Atlas nudged them toward a shining harbor no human eye could hold.

At each port he leapt ashore long enough to chase off things with too many teeth, accept one grateful scratch from Death itself, and vanish again before dawn.

We had thought he was our dog.

In truth, we had been his small vacation between assignments.`,
      "anthropic/claude-opus-4.6": `There are animals who belong to households and animals who merely pass through them while belonging to something larger.

Our shepherd belonged, I think, to roads.

He appeared in the yard one autumn afternoon with burrs in his coat and old intelligence in his eyes. We named him Jasper and assumed, as humans do, that naming made a creature ours. Yet even in comfort he kept the habits of a traveler. He slept facing doors. He listened to distances. Some nights he would lift his head toward the dark and rumble softly, as if hearing orders beyond our range.

When age finally took him, grief left the house echoing. That week each of us dreamed the same dream separately: Jasper running along impossible paths beneath stars, guiding the dead away from cliffs, barking monsters back into fog, carrying messages between lonely souls who had missed one another by lifetimes.

In the last dream he paused, looked over his shoulder, and wagged exactly once before vanishing into a dawn too bright for us to follow.

It comforted me to think that we had not lost him to death.

We had simply returned a working dog to his route.`,
      "google/gemini-3.1-pro-preview": `The vet said there was nothing more to be done, and maybe that's why I told the internet to write about our dog's adventures. It hurt less than admitting I suspected he'd had real ones.

Normal dogs do not know the difference between fox scent and lightning scent. Normal dogs do not stand between sleeping children and empty hallways, growling at things that leave no footprints. Normal dogs definitely do not come home twice with burrs from plants that botanists later confirm are extinct.

That night, after we said goodbye, I found the box under the floorboards he'd scratched at for years. Inside were oddities collected like trophies: a Roman coin, a train ticket dated 2146, a silver tag engraved with a language my phone refused to translate.

There was also a note, in handwriting not ours.

THANK YOU FOR HARBORING RANGER UNIT 7 BETWEEN MISSIONS.
 HE WAS VERY GOOD.

I cried so hard I laughed.

Of course he was.`,
    },
  },
];

if (SEEDED_STORIES.length !== REDDIT_WRITING_PROMPTS.length) {
  throw new Error(
    `Seed prompt count (${REDDIT_WRITING_PROMPTS.length}) does not match story count (${SEEDED_STORIES.length})`,
  );
}

export const REDDIT_SEEDED_RUNS: RedditSeedRun[] = REDDIT_WRITING_PROMPTS.map(
  (prompt, index) => ({
    ...prompt,
    stories: makeStories(SEEDED_STORIES[index]),
  }),
);
