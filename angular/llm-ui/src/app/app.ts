import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LlmOutputDisplayComponent } from './components/llm-output-display/llm-output-display.component'; // Import the new component

@Component({
  selector: 'app-root',
  standalone: true, // Make AppComponent standalone
  imports: [RouterOutlet, LlmOutputDisplayComponent], // Add LlmOutputDisplayComponent to imports
  templateUrl: './app.html', // Keep using external template
  styleUrl: './app.css'
})
export class App {
  protected title = 'llm-ui';
  // Sample data for the LlmOutputDisplayComponent
  testLlmOutput = "Hello, this is a test stream.\n\n* List item 1\n* List item 2\n\n```typescript\nconst example = 'Hello World';\nconsole.log(example);\n```\nMore text after the code block.";
  testIsStreamFinished = false;

  constructor() {
    // Simulate a stream finishing after a delay
    setTimeout(() => {
      this.testLlmOutput += "\nAnd now the stream is complete!";
      this.testIsStreamFinished = true;
    }, 5000);

    // Simulate stream updates
    let count = 0;
    const interval = setInterval(() => {
      if (this.testIsStreamFinished) {
        clearInterval(interval);
        return;
      }
      count++;
      this.testLlmOutput += `\nUpdate ${count}...`;
      // To trigger change detection for the input if llmOutput was an object.
      // For a primitive string, direct assignment is fine.
      // this.testLlmOutput = this.testLlmOutput; 
    }, 1000);
  }
}
