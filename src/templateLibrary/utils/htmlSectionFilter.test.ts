import { extractSectionNames, filterMarkedSections, keepOnlyMarkedSections } from './htmlSectionFilter';

describe('htmlSectionFilter', () => {

  const templateWithManyBlocks = `
    <html>
      <head>
        <style>body { background: #f0f0f0; }</style>
      </head>
      <body>
        <table class="wrapper">
          <!--=============== Header ===============-->
          <tr><td>Header Content</td></tr>
          <!--=============== Header-end ===============-->

          <!--=============== Body ===============-->
          <tr><td>Body Content</td></tr>
          <!--=============== Body-end ===============-->

          <!--=============== Footer ===============-->
          <tr><td>Footer Content</td></tr>
          <!--=============== Footer-end ===============-->
        </table>
      </body>
    </html>
  `;

  test('extractSectionNames finds all blocks correctly', () => {
    const blocks = extractSectionNames(templateWithManyBlocks);
    // Note: extractSectionNames returns alphabetically sorted array
    expect(blocks).toEqual(['Body', 'Footer', 'Header']);
  });

  test('filterMarkedSections correctly hides one block without affecting others', () => {
    const hidden = filterMarkedSections(templateWithManyBlocks, ['Body']);
    expect(hidden).toContain('Header Content');
    expect(hidden).not.toContain('Body Content');
    expect(hidden).toContain('Footer Content');
    expect(hidden).toContain('<table class="wrapper">'); // Preserves wrapper
  });

  test('keepOnlyMarkedSections correctly isolates one block', () => {
    const isolated = keepOnlyMarkedSections(templateWithManyBlocks, ['Header']);
    expect(isolated).toContain('Header Content');
    // It should hide Body and Footer by passing them to filterMarkedSections
    expect(isolated).not.toContain('Body Content');
    expect(isolated).not.toContain('Footer Content');
    
    // It MUST preserve the styles and wrappers
    expect(isolated).toContain('<style>body { background: #f0f0f0; }</style>');
    expect(isolated).toContain('<table class="wrapper">');
  });

  const templateWithWeirdComments = `
    <div>
      <!-- Header -->
      <h1>Hi</h1>
      <!-- Header-end -->

      <!--=== CTA ===-->
      <button>Click</button>
      
      <!-- Footer -->
      <p>Bye</p>
      <!-- Footer-end -->
    </div>
  `;

  test('filterMarkedSections does not aggressively delete across blocks if exact match fails', () => {
    // Hide CTA block. However, it lacks an end tag entirely in the weird template above.
    // The exact regex should fail safely, meaning the button and footer REMAIN intact.
    const hidden = filterMarkedSections(templateWithWeirdComments, ['CTA']);
    
    // It shouldn't delete the other blocks when attempting to find the end tag
    expect(hidden).toContain('<button>Click</button>');
    expect(hidden).toContain('<p>Bye</p>');
    expect(hidden).toContain('<h1>Hi</h1>');
  });

  test('keepOnlyMarkedSections preserves all numbered instances of a block together', () => {
    const templateWithNumbers = `
      <!-- Note-1 -->
      note one
      <!-- Note-1-end -->
      <!-- Note-2-mob -->
      note two
      <!-- Note-2-mob-end -->
      <!-- Footer -->
      footer text
      <!-- Footer-end -->
    `;
    
    // Extracting names should group Note-1 and Note-2-mob into 'Note'
    const names = extractSectionNames(templateWithNumbers);
    expect(names).toContain('Note');
    expect(names).not.toContain('Note-1');
    expect(names).not.toContain('Note-2-mob');

    // If we keep ONLY 'Note', it should hide the Footer, but KEEP note one and note two
    const isolated = keepOnlyMarkedSections(templateWithNumbers, ['Note']);
    expect(isolated).toContain('note one');
    expect(isolated).toContain('note two');
    expect(isolated).not.toContain('footer text');
    
    // If we hide 'Note', it should remove BOTH Note-1 and Note-2-mob
    const hidden = filterMarkedSections(templateWithNumbers, ['Note']);
    expect(hidden).not.toContain('note one');
    expect(hidden).not.toContain('note two');
    expect(hidden).toContain('footer text');
  });
});
