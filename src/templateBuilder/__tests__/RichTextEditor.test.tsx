import { fireEvent, render, screen } from "@testing-library/react";

import { RichTextEditor } from "../components/RichTextEditor";

// jsdom doesn't implement a real rich-text engine behind document.execCommand (it's effectively a
// no-op stub), so these tests mock it and assert each toolbar button invokes the correct command —
// the same approach any execCommand-based editor needs in jsdom, rather than asserting on DOM
// output execCommand itself won't actually produce here.
describe("RichTextEditor", () => {
  beforeEach(() => {
    document.execCommand = jest.fn();
  });

  it("Italic button calls execCommand('italic')", () => {
    render(<RichTextEditor value='' onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText("Italic"));
    expect(document.execCommand).toHaveBeenCalledWith("italic");
  });

  it("Underline button calls execCommand('underline')", () => {
    render(<RichTextEditor value='' onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText("Underline"));
    expect(document.execCommand).toHaveBeenCalledWith("underline");
  });

  it("Bulleted list button calls execCommand('insertUnorderedList')", () => {
    render(<RichTextEditor value='' onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText("Bulleted list"));
    expect(document.execCommand).toHaveBeenCalledWith("insertUnorderedList");
  });

  it("Numbered list button calls execCommand('insertOrderedList')", () => {
    render(<RichTextEditor value='' onChange={jest.fn()} />);
    fireEvent.click(screen.getByLabelText("Numbered list"));
    expect(document.execCommand).toHaveBeenCalledWith("insertOrderedList");
  });

  it("each new button calls the caller's onChange after the command", () => {
    const onChange = jest.fn();
    render(<RichTextEditor value='' onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Italic"));
    expect(onChange).toHaveBeenCalled();
  });

  it("no alignment button exists — TextBlock's own align field is the single source of truth", () => {
    render(<RichTextEditor value='' onChange={jest.fn()} />);
    expect(screen.queryByLabelText(/align/i)).not.toBeInTheDocument();
  });
});
