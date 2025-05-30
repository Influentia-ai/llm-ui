import { Component, OnDestroy, Type } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LlmOutputDisplayComponent } from './components/llm-output-display/llm-output-display.component';
import { LLMOutputBlock, LLMOutputFallbackBlock, MaybeLLMOutputMatch } from './models/llm-output-types'; 
import { TextBlockComponent } from './components/text-block/text-block.component'; 
import { FallbackBlockComponent } from './components/fallback-block/fallback-block.component'; 
// Added for JSON Block
import { JsonBlockComponent } from './components/json-block/json-block.component';
import { getJsonMatchers, getJsonLookBack, JsonBlockOptions } from './utils/json-block-utils';


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
  fullText: string; 
  chunkSize = 10; 
  intervalMs = 100; 
  private currentIndex = 0;
  private streamInterval: any;


  constructor() {
    // Keyword block definition
    const keywordBlock: LLMOutputBlock = {
      component: TextBlockComponent as Type<any>,
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
        for (let i = keyword.length; i > 0; i--) {
          const partialKeyword = keyword.substring(0, i);
          // Ensure partial match is at the beginning of the current input segment
          if (input.toLowerCase().startsWith(partialKeyword.toLowerCase())) {
            return { 
              startIndex: 0, // Relative to input string
              endIndex: i, 
              outputRaw: input.substring(0, i) 
            };
          }
        }
        return undefined;
      },
      lookBack: ({ output, isComplete, visibleTextLengthTarget }) => ({ 
        output, 
        visibleText: output.slice(0, visibleTextLengthTarget) 
      }),
    };

    this.testFallbackBlock = {
      component: FallbackBlockComponent as Type<any>,
      lookBack: ({ output, isComplete, visibleTextLengthTarget }) => ({ 
        output, 
        visibleText: output.slice(0, visibleTextLengthTarget) 
      }),
    };

    this.testBlocks = [keywordBlock]; // Initialize with keyword block

    // JSON Block Definition
    const userProfileOptions: JsonBlockOptions = {
      type: 'user_profile',
      startChar: 'JSON{', // Simplified delimiters for less escaping in string
      endChar: '}JSON',
      typeKey: 'messageType',
      defaultVisible: false,
      visibleKeyPaths: ['$.name', '$.details.age']
    };
    const jsonUserProfileBlock: LLMOutputBlock = {
      component: JsonBlockComponent as Type<any>,
      ...getJsonMatchers(userProfileOptions),
      lookBack: getJsonLookBack(userProfileOptions),
    };
    this.testBlocks.push(jsonUserProfileBlock); // Add JSON block

    // Update fullText to include JSON example
    // Note: Using single quotes for the outer string to make escaping simpler for inner double quotes in JSON.
    this.fullText = 'This is a sample sentence. This is a keyword. ' +
                    'And this is another sentence with the keyword again. ' +
                    'Now for some JSON: JSON{ "messageType": "user_profile", "name": "Alice", "details": { "age": 30, "city": "Wonderland" }, "status": "active" }JSON. ' +
                    'Some trailing text.';
    
    this.startStream();
  }

  startStream(): void { 
    this.currentIndex = 0;
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
