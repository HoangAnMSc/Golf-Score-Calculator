<!-- File: resources/views/score_form.blade.php -->
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Golf Score Calculator</title>
    <link rel="stylesheet" href="/css/style.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>

<body>
    <div class="form-container">
        <h2>Golf Score Calculator</h2>
        <form id="scoreForm" method="POST" action="/submit-score">
            @csrf
            <label>Front 9 Name:
                <input type="text" name="front9" value="Front 9">
            </label>

            <label>Back 9 Name:
                <input type="text" name="back9" value="Back 9">
            </label>

            <label>Start Hole:
                <select name="startHole">
                    @for ($i = 1; $i <= 18; $i++) <option value="{{ $i }}">{{ $i }}</option>
                        @endfor
                </select>
            </label>

            <div class="toggles">
                @foreach ([
                'handicap' => 'Handicap',
                'reachDeclaration' => 'Reach Declaration',
                'birdieBonus' => 'Birdie Bonus',
                'nearPinBonus' => 'Near Pin Bonus',
                'drawCarryover' => 'Draw Carryover',
                'eagleBonus' => 'Eagle Bonus',
                'albatrossBonus' => 'Albatross Bonus',
                'holeInOneBonus' => 'Hole-in-One Bonus'
                ] as $name => $label)
                <label class="switch">
                    <input type="checkbox" name="{{ $name }}" checked>
                    <span class="slider"></span> {{ $label }}
                </label>
                @endforeach
            </div>

            <button type="submit" class="submit-btn">Start Scoring</button>
        </form>
    </div>

    <script>
    $(document).ready(function() {
        $('#scoreForm').on('submit', function(e) {
            // Optional: validate or confirm before submit
            // e.preventDefault();
            // alert("Submitting form...");
        });
    });
    </script>
</body>

</html>