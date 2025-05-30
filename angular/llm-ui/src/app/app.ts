import { Component, OnDestroy, Type } from '@angular/core'; // Added Type
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LlmOutputDisplayComponent } from './components/llm-output-display/llm-output-display.component';
import { LLMOutputBlock, LLMOutputFallbackBlock, MaybeLLMOutputMatch } from './models/llm-output-types'; // Added
import { TextBlockComponent } from './components/text-block/text-block.component'; // Added
import { FallbackBlockComponent } from './components/fallback-block/fallback-block.component'; // Added

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LlmOutputDisplayComponent],
  templateUrl: './app.html', 
  styleUrl: './app.css'   
})
export class App implements OnDestroy {
  title = 'llm-ui';

  // test data for llm-output-display
  testLlmOutput = "";
  testIsStreamFinished = false;

  // Block definitions
  public testBlocks: LLMOutputBlock[];
  public testFallbackBlock: LLMOutputFallbackBlock;

  // Text streaming simulation
  fullText = "This is a sample sentence. This is a keyword. And this is another sentence with the keyword again.";
  chunkSize = 5;
  intervalMs = 200; // ms per chunk
  private currentIndex = 0; // Keep track of current index for streaming
  private streamInterval: any; // Renamed from intervalId for clarity


  constructor() {
    // Define a simple block that matches "keyword"
    this.testBlocks = [
      {
        component: TextBlockComponent as Type<any>, // Use TextBlockComponent
        findCompleteMatch: (input: string): MaybeLLMOutputMatch => {
          const keyword = "keyword";
          const index = input.toLowerCase().indexOf(keyword.toLowerCase());
          if (index !== -1) {
            return {
              startIndex: index,
              endIndex: index + keyword.length,
              outputRaw: input.substring(index, index + keyword.length)
            };
          }
          return undefined;
        },
        findPartialMatch: (input: string): MaybeLLMOutputMatch => { 
          const keyword = "keyword";
          // Look for the keyword at the very beginning of the input string for partial match
          if (input.toLowerCase().startsWith(keyword.toLowerCase().substring(0, input.length))) {
            if (input.length <= keyword.length) { // Only match if it's a partial of "keyword"
                 return {
                    startIndex: 0,
                    endIndex: input.length, // Match the partial input
                    outputRaw: input
                 };
            }
          }
          // More sophisticated partial matching for "keyword" if it's not at the start:
          // This part of the original logic was a bit confusing, let's try to match partials of "keyword"
          for (let i = keyword.length; i > 0; i--) {
            const partialKeyword = keyword.substring(0, i);
            if (input.toLowerCase().startsWith(partialKeyword.toLowerCase())) {
              return {
                startIndex: 0,
                endIndex: i,
                outputRaw: input.substring(0, i)
              };
            }
          }
          return undefined;
        },
        lookBack: ({ output, isComplete, visibleTextLengthTarget }) => ({
          output,
          visibleText: output.slice(0, visibleTextLengthTarget),
        }),
      }
    ];

    this.testFallbackBlock = {
      component: FallbackBlockComponent as Type<any>, // Use FallbackBlockComponent
      lookBack: ({ output, isComplete, visibleTextLengthTarget }) => ({
        output,
        visibleText: output.slice(0, visibleTextLengthTarget),
      }),
    };
    this.startStream();
  }

  startStream(): void {
    this.currentIndex = 0; // Reset current index
    this.testLlmOutput = "";
    this.testIsStreamFinished = false;

    if (this.streamInterval) {
      clearInterval(this.streamInterval);
    }

    this.streamInterval = setInterval(() => {
      if (this.currentIndex < this.fullText.length) {
        const nextChunkEnd = Math.min(this.currentIndex + this.chunkSize, this.fullText.length);
        this.testLlmOutput += this.fullText.substring(this.currentIndex, nextChunkEnd);
        this.currentIndex = nextChunkEnd;
      } else {
        this.testIsStreamFinished = true;
        clearInterval(this.streamInterval);
        this.streamInterval = null;
      }
    }, this.intervalMs);
  }

  ngOnDestroy(): void {
    if (this.streamInterval) {
      clearInterval(this.streamInterval);
    }
  }
}
