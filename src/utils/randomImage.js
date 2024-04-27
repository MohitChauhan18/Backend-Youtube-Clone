

// Example usage:
const narutoCharacters =[
    "Naruto Uzumaki",
    "Sasuke Uchiha",
    "Sakura Haruno",
    "Kakashi Hatake",
    "Itachi Uchiha",
    "Jiraiya",
    "Tsunade",
    "Orochimaru",
    "Gaara",
    "Rock Lee",
    "Neji Hyuga",
    "Hinata Hyuga",
    "Shikamaru Nara",
    "Ino Yamanaka",
    "Choji Akimichi",
    "Kiba Inuzuka",
    "Shino Aburame",
    "Tenten",
    "Temari",
    "Kankuro",
    "Minato Namikaze",
    "Kushina Uzumaki",
    "Pain",
    "Konan",
    "Madara Uchiha",
    "Hashirama Senju",
    "Tobirama Senju",
    "Hiruzen Sarutobi",
    "Obito Uchiha",
    "Might Guy",
    "Killer Bee",
    "Sai",
    "Yamato",
    "Haku",
    "Zabuza Momochi",
    "Kabuto Yakushi",
    "Shizune",
    "Iruka Umino",
    "Asuma Sarutobi",
    "Konohamaru Sarutobi",
    "Boruto Uzumaki",
    "Sarada Uchiha",
    "Mitsuki",
    "Himawari Uzumaki",
    "Shikadai Nara",
    "Chocho Akimichi",
    "Inojin Yamanaka",
    "Metal Lee",
    "Sumire Kakei",
    "Kaguya Otsutsuki"
]

export function getRandomNarutoCharacter() {
    // Generate a random index within the range of the array
    const randomIndex = Math.floor(Math.random() * narutoCharacters.length);
    // Return the character at the random index
    return narutoCharacters[randomIndex];
}