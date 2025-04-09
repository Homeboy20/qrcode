import webbrowser

def open_sequence_tab():
    print("Opening browser to sequence tab...")
    webbrowser.open('http://127.0.0.1:5000/#sequence-tab')
    print("Please check that the UI loads correctly and use the sequence form to generate barcodes.")
    print("The generated barcodes should display in a grid layout in the right column.")

if __name__ == "__main__":
    open_sequence_tab() 