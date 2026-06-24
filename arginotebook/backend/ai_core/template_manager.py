import json
from typing import List, Dict

class ContentTemplate:
    def __init__(self, name: str, description: str, system_instruction: str, structure: List[Dict]):
        self._name = name
        self._description = description
        self._system_instruction = system_instruction
        self._structure = structure
        
    @property
    def name(self) -> str:
        return self._name

    @property
    def description(self) -> str:
        return self._description

    @property
    def system_instruction(self) -> str:
        return self._system_instruction

    @property
    def structure(self) -> List[Dict]:
        return self._structure

    def to_string(self) -> str:
        data = {
            "name": self._name,
            "description": self._description,
            "system_instruction": self._system_instruction,
            "structure": self._structure
        }
        return json.dumps(data, ensure_ascii=False, indent=2)
    
    