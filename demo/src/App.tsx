import { animate, useViewTransition } from "../../src";
import { useState } from "react";

let count = 4;

function App() {
  return (
    <div>
      <Todo />
      <Faq />

      <animate.section>
        <Shuffle />
      </animate.section>

      <animate.section>
        <Chat />
      </animate.section>
    </div>
  );
}

function Chat() {
  const withTransition = useViewTransition();
  const [messages, setMessages] = useState(["sup", "dude"]);

  return (
    <>
      <div
        style={{
          border: "1px solid gray",
          width: 400,
          height: 100,
          overflow: "scroll",
          display: "flex",
          flexDirection: "column",
          justifyContent: "end",
        }}
      >
        {messages.map((message, index) => {
          const even = index % 2 === 1;

          return (
            <animate.div
              key={message + index}
              style={{
                background: even ? "lightgray" : "lightblue",
                borderRadius: 9999,
              }}
            >
              {message}
            </animate.div>
          );
        })}
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const message = event.currentTarget.message.value;
          withTransition(() => setMessages((prev) => [...prev, message]));
          event.currentTarget.reset();
        }}
      >
        <input name="message" type="text" placeholder="Send message" />
        <button type="submit">Send</button>
      </form>
    </>
  );
}

function Shuffle() {
  const withTransition = useViewTransition();
  const [blocks, setBlocks] = useState(["blue", "red", "green"]);

  function shuffle() {
    let newBlocks = [...blocks];
    let currentIndex = newBlocks.length,
      randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [newBlocks[currentIndex], newBlocks[randomIndex]] = [
        newBlocks[randomIndex],
        newBlocks[currentIndex],
      ];
    }

    withTransition(() => setBlocks(newBlocks));
  }

  return (
    <div>
      <button onClick={shuffle}>Shuffle</button>
      <div style={{ display: "flex" }}>
        {blocks.map((block) => (
          <animate.div
            key={block}
            style={{ width: 100, height: 200, background: block }}
          />
        ))}
      </div>
    </div>
  );
}

const questions = [
  {
    question: "what is this library for?",
    answer: "It animates elements to different positions",
  },
  {
    question: "why would I use it?",
    answer: "I'm honestly not sure",
  },
];

function Faq() {
  const [selected, setSelected] = useState(questions[0].question);
  const withTransition = useViewTransition();

  function select(item: string) {
    withTransition(() => {
      setSelected(item);
    });
  }

  return (
    <div>
      {questions.map(({ question, answer }) => (
        <>
          <animate.button
            key={question}
            onClick={() => select(question)}
            style={{ display: "block" }}
          >
            {question}
          </animate.button>
          {selected === question ? <animate.p>{answer}</animate.p> : null}
        </>
      ))}
    </div>
  );
}

function Todo() {
  const withTransition = useViewTransition();
  const [items, setItems] = useState<ReadonlyArray<number>>([3, 2, 1]);

  function addItem() {
    const newItems = [count++, ...items];
    withTransition(() => setItems(newItems));
  }

  function deleteItem(itemToDelete: number) {
    const newItems = items.filter((item) => item !== itemToDelete);
    withTransition(() => setItems(newItems));
  }

  return (
    <div>
      <button onClick={addItem}>Add item</button>
      <ul>
        {items.map((item) => (
          <animate.li key={item}>
            {item} <button onClick={() => deleteItem(item)}>×</button>
          </animate.li>
        ))}
      </ul>
    </div>
  );
}

export default App;
