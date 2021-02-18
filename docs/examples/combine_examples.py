#!/usr/bin/python
from glob import glob
import json
import os


def get_immediate_subdirectories(a_dir):
    return [name for name in os.listdir(a_dir)
            if os.path.isdir(os.path.join(a_dir, name))]


# Combine all json examples into one
out = []
directories = sorted(get_immediate_subdirectories('.'))
for directory in directories:
    # Create group
    group = {
        "group": directory,
        "items": []
    }

    # Add all examples
    examples = sorted(glob(os.path.join(directory, '*.json')))
    for example in examples:
        with open(example, 'r') as f:
            name = example.split('/')[1].split('.')[0]
            group["items"].append({
                "name": name,
                "value": json.load(f)
            })

    out.append(group)


with open('../examples.json', 'w') as f:
    json.dump(out, f)
